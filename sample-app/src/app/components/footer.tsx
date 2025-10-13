import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="flex items-center justify-center text-xs h-[76px]">
      <Link href={'https://www.twilio.com/'}>Copyright © 2023 Twilio Inc.</Link>
    </footer>
  );
}
