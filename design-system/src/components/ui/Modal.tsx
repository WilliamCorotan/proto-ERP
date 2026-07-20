import React from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen &&
      <>
          <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose} />
        
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20
            }}
            className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg pointer-events-auto">
            
              <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
                <div className="flex items-center justify-between">
                  {title &&
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                      {title}
                    </h2>
                }
                  <button
                  onClick={onClose}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
                {description &&
              <p className="text-sm text-muted-foreground">{description}</p>
              }
              </div>
              <div className="mb-4">{children}</div>
              {footer &&
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                  {footer}
                </div>
            }
            </motion.div>
          </div>
        </>
      }
    </AnimatePresence>);

}