import React from 'react';
import { FeaturePage } from '../src/components/FeaturePage';
export default function Screen() { return <FeaturePage title={"Messages"} intro={"Your future secure inbox for direct conversations and voice notes."} features={[
    { title: "Direct messages", description: "Requires authenticated message tables and realtime subscriptions." },
    { title: "Voice messages", description: "Requires recording permissions, media storage and playback." },
    { title: "Audio and video calls", description: "Requires a calling provider and permissions; not enabled in this screen." }
  ]} actions={[

  ]} />; }
