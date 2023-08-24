import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-[#06033a] flex pl-20 items-center justify-start h-[76px] text-white sticky">
      <span>
        <Link href={'/'}>
          <Image priority src="logo.svg" height={32} width={32} alt="Twilio" />
        </Link>
      </span>
      <span className="border-[0.5px] border-[#e1e3ea] h-[80%] ml-5 mr-5"></span>
      <span className="text-lg">TaskRouter V2 Sample App</span>
    </header>
  );
}
