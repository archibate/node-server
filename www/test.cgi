#!/bin/sh
echo Content-type: text/html

echo "<h2>It Works!</h2><hr/>"
echo "<p>HTTP Method: <code>$METHOD</code></p>"
if [ ! -z $QUERY_STRING ]; then
	echo "<p>Query String: <code>$QUERY_STRING</code></p>"
fi
