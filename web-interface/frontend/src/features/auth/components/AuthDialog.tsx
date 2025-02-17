import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
  Button,
} from '@headlessui/react';
import { Fragment, useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

export function AuthDialog({ isOpen, onClose, initialView = 'login' }: AuthDialogProps) {
  const [view, setView] = useState<'login' | 'register'>(initialView);

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </TransitionChild>

        {/* Dialog */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="modal-box w-full max-w-md bg-base-100">
              <DialogTitle as="h3" className="text-2xl font-bold mb-6 text-primary">
                {view === 'login' ? 'Sign In' : 'Create Account'}
              </DialogTitle>

              {view === 'login' ? (
                <LoginForm onSuccess={onClose} />
              ) : (
                <RegisterForm onSuccess={() => {
                  setView('login');
                }} />
              )}

              <div className="divider my-6">OR</div>

              <div className="text-sm text-center text-base-content">
                {view === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <Button
                      onClick={() => setView('register')}
                      className="btn btn-link btn-sm px-2 min-h-0 h-auto data-[hover]:underline"
                    >
                      Sign up
                    </Button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <Button
                      onClick={() => setView('login')}
                      className="btn btn-link btn-sm px-2 min-h-0 h-auto data-[hover]:underline"
                    >
                      Sign in
                    </Button>
                  </p>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
