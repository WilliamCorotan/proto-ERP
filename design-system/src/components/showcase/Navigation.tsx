import React, { useState, Component } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator } from
'../ui/Breadcrumb';
export function Navigation() {
  const [activeTab, setActiveTab] = useState('account');
  return (
    <section id="navigation" className="space-y-8 scroll-mt-24">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Navigation</h2>
        <p className="text-muted-foreground mt-2">
          Components for moving through the application.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Tabs</h3>
          <div className="p-6 border rounded-xl bg-card">
            <Tabs className="w-[400px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  active={activeTab === 'account'}
                  onClick={() => setActiveTab('account')}>
                  
                  Account
                </TabsTrigger>
                <TabsTrigger
                  active={activeTab === 'password'}
                  onClick={() => setActiveTab('password')}>
                  
                  Password
                </TabsTrigger>
              </TabsList>
              <TabsContent
                active={activeTab === 'account'}
                className="p-4 border rounded-md mt-2">
                
                <p className="text-sm text-muted-foreground">
                  Make changes to your account here. Click save when you're
                  done.
                </p>
              </TabsContent>
              <TabsContent
                active={activeTab === 'password'}
                className="p-4 border rounded-md mt-2">
                
                <p className="text-sm text-muted-foreground">
                  Change your password here. After saving, you'll be logged out.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Breadcrumbs</h3>
          <div className="p-6 border rounded-xl bg-card">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Profile</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </div>
    </section>);

}