import React from 'react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
export function Forms() {
  return (
    <section id="forms" className="space-y-8 scroll-mt-24">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Forms</h2>
        <p className="text-muted-foreground mt-2">
          Input controls for data entry and configuration.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Text Inputs</h3>
            <div className="space-y-4 p-6 border rounded-xl bg-card">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="name@company.com" />
                <p className="text-xs text-muted-foreground">
                  Enter your corporate email address.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="error-input">Invalid Input</Label>
                <Input id="error-input" error defaultValue="wrong-email" />
                <p className="text-xs text-destructive">
                  Please enter a valid email.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="disabled-input">Disabled Input</Label>
                <Input id="disabled-input" disabled placeholder="Not allowed" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium">Textarea</h3>
            <div className="space-y-4 p-6 border rounded-xl bg-card">
              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special instructions here..." />
                
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Select & Dropdowns</h3>
            <div className="space-y-4 p-6 border rounded-xl bg-card">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select id="department">
                  <option value="" disabled selected>
                    Select a department
                  </option>
                  <option value="hr">Human Resources</option>
                  <option value="it">Information Technology</option>
                  <option value="finance">Finance</option>
                  <option value="sales">Sales</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium">Toggles & Choices</h3>
            <div className="space-y-6 p-6 border rounded-xl bg-card">
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms" className="font-normal">
                  Accept terms and conditions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="notifications" />
                <Label htmlFor="notifications" className="font-normal">
                  Enable email notifications
                </Label>
              </div>

              <div className="space-y-3 pt-2">
                <Label>Priority Level</Label>
                <RadioGroup defaultValue="normal">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="r1" />
                    <Label htmlFor="r1" className="font-normal">
                      Low
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="r2" />
                    <Label htmlFor="r2" className="font-normal">
                      Normal
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="r3" />
                    <Label htmlFor="r3" className="font-normal">
                      High
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}