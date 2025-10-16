#!/usr/bin/expect -f
spawn vercel --prod
expect "Set up and deploy"
send "y\r"
expect eof
