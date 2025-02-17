import { Dialog, Transition } from '@headlessui/react';
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
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        {/* Dialog */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <Dialog.Title className="text-xl font-semibold mb-4">
                {view === 'login' ? 'Sign In' : 'Create Account'}
              </Dialog.Title>

              {view === 'login' ? (
                <LoginForm onSuccess={onClose} />
              ) : (
                <RegisterForm onSuccess={() => {
                  setView('login');
                }} />
              )}

              <div className="mt-4 text-sm text-center">
                {view === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <button
                      onClick={() => setView('register')}
                      className="text-primary hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      onClick={() => setView('login')}
                      className="text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
