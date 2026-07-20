import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '../ui/Alert';
import { Progress } from '../ui/Progress';
import { Skeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
export function Feedback() {
  return (
    <section id="feedback" className="space-y-8 scroll-mt-24">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Feedback</h2>
        <p className="text-muted-foreground mt-2">
          Alerts, toasts, and loading states to keep users informed.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Alerts</h3>
          <div className="space-y-4 p-6 border rounded-xl bg-card">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                You can add components to your app using the cli.
              </AlertDescription>
            </Alert>
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your changes have been saved successfully.
              </AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Your session is about to expire in 5 minutes.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to connect to the database. Please try again later.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Toasts</h3>
          <div className="flex flex-wrap gap-4 p-6 border rounded-xl bg-card items-center">
            <Button
              variant="outline"
              onClick={() =>
              toast('Event has been created', {
                description: 'Sunday, December 03, 2023 at 9:00 AM'
              })
              }>
              
              Show Default Toast
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.success('Successfully saved!')}>
              
              Show Success Toast
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.error('Failed to save.')}>
              
              Show Error Toast
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Progress</h3>
            <div className="space-y-4 p-6 border rounded-xl bg-card">
              <Progress value={33} />
              <Progress value={66} />
              <Progress value={100} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium">Skeleton</h3>
            <div className="space-y-4 p-6 border rounded-xl bg-card">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}