import React, { Component } from 'react';
import { Badge } from '../ui/Badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter } from
'../ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell } from
'../ui/Table';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
export function DataDisplay() {
  return (
    <section id="data-display" className="space-y-8 scroll-mt-24">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Data Display</h2>
        <p className="text-muted-foreground mt-2">
          Components for presenting data, metrics, and entities.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Badges & Statuses</h3>
          <div className="flex flex-wrap gap-4 p-6 border rounded-xl bg-card items-center">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Approved</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="destructive">Rejected</Badge>
            <Badge variant="info">Draft</Badge>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Avatars</h3>
          <div className="flex flex-wrap gap-4 p-6 border rounded-xl bg-card items-center">
            <Avatar>
              <AvatarImage src="https://i.pravatar.cc/150?u=1" alt="User 1" />
              <AvatarFallback>U1</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src="https://i.pravatar.cc/150?u=2" alt="User 2" />
              <AvatarFallback>U2</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex -space-x-3">
              <Avatar className="border-2 border-background">
                <AvatarImage src="https://i.pravatar.cc/150?u=3" />
              </Avatar>
              <Avatar className="border-2 border-background">
                <AvatarImage src="https://i.pravatar.cc/150?u=4" />
              </Avatar>
              <Avatar className="border-2 border-background">
                <AvatarFallback>+3</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Cards</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
                <CardDescription>Monthly recurring revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$45,231.89</div>
                <p className="text-xs text-success flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> +20.1% from last
                  month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Subscriptions</CardTitle>
                <CardDescription>Current billing cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">+2,350</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowDownRight className="h-3 w-3 mr-1 text-destructive" />{' '}
                  -4% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>All services operational</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-medium">Healthy</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Logs
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Data Table</h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">INV001</TableCell>
                  <TableCell>
                    <Badge variant="success">Paid</Badge>
                  </TableCell>
                  <TableCell>Credit Card</TableCell>
                  <TableCell className="text-right">$250.00</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">INV002</TableCell>
                  <TableCell>
                    <Badge variant="warning">Pending</Badge>
                  </TableCell>
                  <TableCell>PayPal</TableCell>
                  <TableCell className="text-right">$150.00</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">INV003</TableCell>
                  <TableCell>
                    <Badge variant="destructive">Overdue</Badge>
                  </TableCell>
                  <TableCell>Bank Transfer</TableCell>
                  <TableCell className="text-right">$350.00</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </section>);

}