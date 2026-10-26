import React from 'react';
import { FeaturePage } from '../src/components/FeaturePage';
export default function Screen() { return <FeaturePage title={"BRITUME Studio"} intro={"A creator workspace planned for beats, recording and music projects."} features={[
    { title: "Beat workspace", description: "A sequencer and instrument engine still need implementation." },
    { title: "Recording", description: "Microphone permissions, audio capture, editing and export are not yet wired." },
    { title: "Creator library", description: "Save and manage projects once storage is connected." }
  ]} actions={[

  ]} />; }
