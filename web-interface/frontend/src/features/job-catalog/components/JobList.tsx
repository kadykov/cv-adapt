import { useState } from 'react';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { JobCard } from './JobCard';
import { useJobs } from '../hooks/useJobs';

const LANGUAGE_OPTIONS = [
  { id: 'en', name: 'English' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'es', name: 'Spanish' },
  { id: 'it', name: 'Italian' },
] as const;

interface JobListProps {
  onJobSelect?: (jobId: number) => void;
}

export function JobList({ onJobSelect }: JobListProps) {
  const [selectedLang, setSelectedLang] = useState(LANGUAGE_OPTIONS[0]);
  const { data: jobs, isLoading, error } = useJobs({ languageCode: selectedLang.id });

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-error">Failed to load jobs</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <span role="status" className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Listbox value={selectedLang} onChange={setSelectedLang}>
          <div className="relative w-48">
            <ListboxButton className="relative w-full cursor-default rounded-lg bg-base-200 py-2 pl-3 pr-10 text-left focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-75 focus-visible:ring-offset-2">
              <span className="block truncate">{selectedLang.name}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <svg
                  className="h-5 w-5 text-base-content/70"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </ListboxButton>
            <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-base-100 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {LANGUAGE_OPTIONS.map((lang) => (
                <ListboxOption
                  key={lang.id}
                  value={lang}
                  className={({ selected }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 hover:bg-primary/10 ${
                      selected ? 'text-base-content' : 'text-base-content/70'
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {lang.name}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
      </div>

      {jobs && jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => onJobSelect?.(job.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-base-content/70">No jobs found</p>
        </div>
      )}
    </div>
  );
}
