import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';
import { Button } from '../ui/Button';
export function Overlays() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <section id="overlays" className="space-y-8 scroll-mt-24">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Overlays</h2>
        <p className="text-muted-foreground mt-2">
          Modals, tooltips, and contextual menus.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Modal / Dialog</h3>
          <div className="p-6 border rounded-xl bg-card">
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Edit Profile"
              description="Make changes to your profile here. Click save when you're done."
              footer={
              <>
                  <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="mt-2 sm:mt-0">
                  
                    Cancel
                  </Button>
                  <Button onClick={() => setIsModalOpen(false)}>
                    Save changes
                  </Button>
                </>
              }>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label
                    htmlFor="name"
                    className="text-right text-sm font-medium">
                    
                    Name
                  </label>
                  <input
                    id="name"
                    defaultValue="Pedro Duarte"
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label
                    htmlFor="username"
                    className="text-right text-sm font-medium">
                    
                    Username
                  </label>
                  <input
                    id="username"
                    defaultValue="@peduarte"
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  
                </div>
              </div>
            </Modal>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Tooltip</h3>
          <div className="p-6 border rounded-xl bg-card flex gap-4">
            <Tooltip content="Add to library">
              <Button variant="outline" size="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4">
                  
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </Button>
            </Tooltip>
            <Tooltip content="Settings">
              <Button variant="outline">Hover me</Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </section>);

}