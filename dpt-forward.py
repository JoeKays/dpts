#!/usr/bin/env python3

import argparse
import serial
import os
import time
from signal import signal, SIGINT
from sys import exit

# https://www.devdungeon.com/content/python-catch-sigint-ctrl-c
def handler(signal_received, frame):
	cleanup()
	print('SIGINT or CTRL-C detected. Exiting gracefully...')
	exit(0)

# https://stackoverflow.com/questions/37140846/how-to-convert-ipv6-link-local-address-to-mac-address-in-python
def mac2ipv6(mac):
	# only accept MACs separated by a colon
	parts = mac.split(":")

	# modify parts to match IPv6 value
	parts.insert(3, "ff")
	parts.insert(4, "fe")
	parts[0] = "%x" % (int(parts[0], 16) ^ 2)

	# format output
	ipv6Parts = []
	for i in range(0, len(parts), 2):
		ipv6Parts.append("".join(parts[i:i+2]))
	ipv6 = "fe80::%s/64" % (":".join(ipv6Parts))
	return ipv6

def cleanup():
	global interface
	global link_local
	# TODO: find a solution for Windows and Mac
	if args.route or args.forward:
		os.system('sudo ip -6 route del fe80::/64 dev ' + interface + ' proto ra')
	if args.assign or args.forward:
		os.system('sudo ip -6 address del dev ' + interface + ' scope link ' + link_local)

# --- MAIN --- #

if __name__ == '__main__':
	# Tell Python to run the handler() function when SIGINT is recieved
	signal(SIGINT, handler)

# Check platform
windows = os.name == 'nt'
linux = os.name == 'posix'

default_tty = '/dev/ttyACM0'

parser = argparse.ArgumentParser(add_help = False)
parser.add_argument('-h', '--help', action = 'help', help=argparse.SUPPRESS)

ether_group = parser.add_argument_group(title = 'Ethernet over usb options')
ether_group.add_argument('--usb', metavar = ('TTY'), nargs = '?', const = default_tty, help = 'Start ethernet over usb. (optional) Specify TTY (default: ' + default_tty + ')')

forward_group = parser.add_argument_group(title='Forwarding options')
forward_group.add_argument('--forward', nargs = 1, metavar = ('IP'), help = 'Start forwarding to IPv6 address IP')
forward_group.add_argument('--interface', default = 'usb0', help = '(optional) network interface name (default: usb0)')
forward_group.add_argument('--port', '-p',  default = '8443', help = '(optional) port (default: 8443)')
forward_group.add_argument('--assign', '-ip', action = "store_true", help = 'Assign IPv6 link-local address. Included in --forward.')
forward_group.add_argument('--route', '-r', action = "store_true", help = 'Assign route to IPv6 link-local address. Included in --forward.')
args = parser.parse_args()

tty = args.usb
if args.forward:
	 ip = args.forward[0]
interface = args.interface
port = args.port
link_local = ''

if args.usb:
	if os.path.exists(tty):
		print('Switching usb mode on tty "' + tty + '"...')
		print('Note: Now would be a good time to unlock your device...')
		# from https://github.com/janten/dpt-rp1-py/blob/master/docs/linux-ethernet-over-usb.md
		ser = serial.Serial(tty)
		if windows or linux:
			ser.write(b"\x01\x00\x00\x01\x00\x00\x00\x01\x00\x04") # RNDIS ethernet interface (Windows, Linux default)
		else:
			ser.write(b"\x01\x00\x00\x01\x00\x00\x00\x01\x01\x04") # CDC ethernet interface (Mac, Linux)
		ser.close()
		time.sleep(1)
		print('Switched usb mode to ethernet.')
	else:
		print('Warning: ' + tty + ' does not exist. Either ethernet over USB was already activated or you used the wrong tty. Try ls /dev/tty* to find out the correct tty. If there is multiple make a guess.')
		

if args.assign or args.forward:
	print('Interface ' + interface + ' MAC is:')
	# TODO: find a solution for getting the interface's MAC address on Windows and Mac
	mac = str(os.system('cat /sys/class/net/' + interface + '/address'))
	link_local = mac2ipv6(mac)
	print('Assigning IPv6 address...')
	# TODO: find a solution for assigning an IP address to an interface on Windows and Mac
	err = os.system('sudo ip -6 address add dev ' + interface + ' scope link ' + link_local)
	if err:
		print('Warning: Could not assign IP.')
	else:
		print('Assigned IPv6 address')

if args.route or args.forward:
	print('Creating route...')
	# TODO: find a solution for creating a route on Windows and Mac
	err = os.system('sudo ip -6 route add fe80::/64 dev ' + interface + ' proto ra')
	if err:
		print('Warning: Could not create route.')
	else:
		print('Created route.')

if args.forward:
	print('Starting to forward...')
	print('Press Ctrl+C interrupt to exit...')
	# TODO: find a solution for IP forwarding on Windows and Mac
	err = os.system('socat TCP4-LISTEN:' + port + ',fork TCP6:\[' + ip + '%' + interface + '\]:8443')
	if err:
	 	print('Forwarding failed. Exiting...')
elif args.assign or args.route:
	input('Press Enter to stop.')

print('Resetting....')
cleanup()
print('Done.')
