import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RegistrationForm } from './RegistrationForm';
import { ProgramSchema } from '@/lib/programSchemas';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: ProgramSchema;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  program,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Register for {program.name}
          </DialogTitle>
          <p className="text-gray-600 text-center mt-2">
            Please fill out the form below to register for this program. 
            We'll get back to you soon with more details.
          </p>
        </DialogHeader>
        
        <div className="mt-6">
          <RegistrationForm program={program} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
};