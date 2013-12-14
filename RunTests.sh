#!/bin/bash

. /home/shared/.nvm/nvm.sh
nvm use 0.11 > /dev/null

mocha --harmony --recursive --reporter dot ./tests/*.njs

# this is a patch.. for some reason mocha creates this file
# TODO figure out why and remove this line of code
rm ./--recursive > /dev/null 2>&1

 pid=$(ps u | grep node | grep -Po "\S+\s+(\d+)\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+node --harmony Main.njs 3000" | grep -Po "^\S+\s+\S+" | grep -Po "\d+$")

# TODO killing the process should be done in the test teardown, not here.
if [ "$pid" != "" ]; then
   echo "Notice: Test exited abruptly"
   echo -e "\tKilling lingering server process. (Main.njs)\n"
   kill $pid
fi
