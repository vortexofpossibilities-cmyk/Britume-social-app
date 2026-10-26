import React from 'react';
import { FeaturePage } from '../src/components/FeaturePage';
export default function Screen() { return <FeaturePage title={"Competitions"} intro={"Challenges for creators, students, gamers and communities."} features={[
    { title: "Challenges", description: "Publish rules, deadlines and submission requirements." },
    { title: "Submissions", description: "Media upload and moderation need backend storage and review tools." },
    { title: "Leaderboards", description: "Use trusted server-side scoring rather than editable local scores." }
  ]} actions={[

  ]} />; }
