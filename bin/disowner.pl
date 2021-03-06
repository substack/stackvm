#!/usr/bin/env perl
use strict;
use warnings;
use POSIX qw/WNOHANG/;
use Time::HiRes qw/sleep/;
$|++;

$SIG{CHLD} = 'IGNORE';
if (my $pid = fork) {
    print $pid;
}
else {
    sleep 0.1; # time for the print to finish up
    close \*STDERR;
    close \*STDOUT;
    exec @ARGV;
}
