#!/usr/bin/env python
print('Content-type: text/html')

import os, sys

class CGI():
    def __init__(self):
        self._query = dict()
        qs = os.getenv('QUERY_STRING', None)
        if qs is None and len(sys.argv) >= 1:
            qs = sys.argv[1]
        if qs is not None:
            for q in qs.split('&'):
                try:
                    key, val = q.split('=', 2)
                except:
                    key, val = q, None
                self._query[key] = val

    def __getitem__(self, key):
        return self._query[key]

cgi = CGI()
username = cgi['username']
password = cgi['password']

users = open('var/users.txt', 'r+')
for line in users.readlines():
    try:
        rname, _ = line.split(':', 2)
    except:
        continue
    if rname == username:
        print('ERROR: User Name already Exist')
        break
else:
    users.close()
    users = open('var/users.txt', 'a+')
    users.write(':'.join((username, password)) + '\n')
    print('OK')

users.close()
