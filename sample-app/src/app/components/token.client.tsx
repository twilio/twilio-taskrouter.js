'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function Token() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inputFields, setInputFields] = useState({
    accountSid: searchParams.get('accountSid') || '',
    signingKeySid: searchParams.get('signingKeySid') || '',
    signingKeySecret: searchParams.get('signingKeySecret') || '',
    workspaceSid: searchParams.get('workspaceSid') || '',
    workerSid: searchParams.get('workerSid') || '',
    identity: searchParams.get('identity') || '',
    environment: searchParams.get('environment') || '',
  });
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const validateValues = (inputValues: any) => {
    let errors: any = {};
    if (!inputValues.accountSid.length) {
      errors.accountSid = 'Account Sid is required';
    }
    if (!inputValues.signingKeySid.length) {
      errors.signingKeySid = 'SigningKey Sid is required';
    }
    if (!inputValues.signingKeySecret.length) {
      errors.signingKeySecret = 'SigningKey Secret is required';
    }
    if (!inputValues.workspaceSid.length) {
      errors.workspaceSid = 'Workspace Sid is required';
    }
    if (!inputValues.workerSid.length) {
      errors.workerSid = 'Worker Sid is required';
    }
    if (!inputValues.identity.length) {
      errors.identity = 'Identity is required';
    }
    if (!inputValues.environment.length) {
      errors.environment = 'Environment is required';
    }
    return errors;
  };

  const handleChange = (e: any) => {
    setInputFields({ ...inputFields, [e.target.name]: e.target.value });
  };

  const handleSubmit = (event: any) => {
    event.preventDefault();
    setErrors(validateValues(inputFields));
    setSubmitting(true);
  };

  const handleClearAllInputs = (e: any) => {
    e.preventDefault();

    setInputFields({
      ...inputFields,
      ...{
        accountSid: '',
        signingKeySid: '',
        signingKeySecret: '',
        workspaceSid: '',
        workerSid: '',
        identity: '',
        environment: '',
      },
    });

    router.push('/');
  };

  const finishSubmit = () => {
    router.push(
      `/?accountSid=${inputFields.accountSid}&signingKeySid=${inputFields.signingKeySid}` +
        `&signingKeySecret=${inputFields.signingKeySecret}&workspaceSid=${inputFields.workspaceSid}` +
        `&workerSid=${inputFields.workerSid}&identity=${inputFields.identity}&environment=${inputFields.environment}`,
    );
    router.refresh();
  };

  useEffect(() => {
    if (Object.keys(errors).length === 0 && submitting) {
      finishSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex h-full flex-row justify-between">
        <div>
          <div className="flex mb-2">
            <label className="pt-2 min-w-[150px]" htmlFor="accountSid">
              Account Sid
            </label>
            <div>
              <input
                name="accountSid"
                suppressHydrationWarning
                className="w-[320px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 "
                value={inputFields.accountSid}
                onChange={handleChange}
                type="text"
              />
              {errors.accountSid ? <p className="text-[#d6201f]">{errors.accountSid}</p> : null}
            </div>
          </div>
          <div className="flex mb-2">
            <label className="pt-2 min-w-[150px]" htmlFor="signingKeySid">
              SigningKey Sid
            </label>
            <div>
              <input
                suppressHydrationWarning
                className="w-[320px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 "
                type="text"
                name="signingKeySid"
                value={inputFields.signingKeySid}
                onChange={handleChange}
              />
              {errors.signingKeySid ? <p className="text-[#d6201f]">{errors.signingKeySid}</p> : null}
            </div>
          </div>
          <div className="flex mb-2">
            <label className="pt-2 min-w-[150px]" htmlFor="signingKeySecret">
              SigningKey Secret
            </label>
            <div>
              <input
                suppressHydrationWarning
                className="w-[320px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 "
                type="text"
                name="signingKeySecret"
                value={inputFields.signingKeySecret}
                onChange={handleChange}
              />
              {errors.signingKeySecret ? <p className="text-[#d6201f]">{errors.signingKeySecret}</p> : null}
            </div>
          </div>
          <div className="flex mb-2">
            <label className="pt-2 min-w-[150px]" htmlFor="workspaceSid">
              Workspace Sid
            </label>
            <div>
              <input
                suppressHydrationWarning
                className="w-[320px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 "
                type="text"
                name="workspaceSid"
                value={inputFields.workspaceSid}
                onChange={handleChange}
              />
              {errors.workspaceSid ? <p className="text-[#d6201f]">{errors.workspaceSid}</p> : null}
            </div>
          </div>
          <div className="flex mb-2">
            <label className="pt-2 min-w-[150px]" htmlFor="workerSid">
              Worker Sid
            </label>
            <div>
              <input
                suppressHydrationWarning
                className="w-[320px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 "
                type="text"
                name="workerSid"
                value={inputFields.workerSid}
                onChange={handleChange}
              />
              {errors.workerSid ? <p className="text-[#d6201f]">{errors.workerSid}</p> : null}
            </div>
          </div>
          <div className="flex mb-2">
            <label className="pt-2 min-w-[150px]" htmlFor="identity">
              Identity
            </label>
            <div>
              <input
                suppressHydrationWarning
                className="w-[320px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 "
                type="text"
                name="identity"
                value={inputFields.identity}
                onChange={handleChange}
              />
              {errors.identity ? <p className="text-[#d6201f]">{errors.identity}</p> : null}
            </div>
          </div>
          <div className="flex mb-2">
            <label className="pt-2 min-w-[150px]" htmlFor="environment">
              Environment
            </label>
            <div>
              <input
                suppressHydrationWarning
                className="w-[320px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                type="text"
                name="environment"
                value={inputFields.environment}
                onChange={handleChange}
              />
              {errors.environment ? <p className="text-[#d6201f]">{errors.environment}</p> : null}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-around h-full  mr-5">
          <div>
            <button className="bg-[#0263e0] hover:bg-[#06033a] text-white py-2 px-4 rounded font-medium" type="submit">
              Get New Token
            </button>
            {Object.keys(errors).length === 0 && submitting ? (
              <div className="text-green-600">Successfully submitted</div>
            ) : null}
          </div>
          <div>
            <button
              onClick={handleClearAllInputs}
              className="bg-white enabled:hover:bg-[#ebf4ff] enable:hover:text-[#030b5d] font-medium text-[#121c2d] py-2 px-4 rounded border-[1px] border-gray-500 enabled:hover:border-[#121c2d]"
            >
              Clear all inputs
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
