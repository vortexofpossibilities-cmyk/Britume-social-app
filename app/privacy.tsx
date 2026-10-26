import React from 'react';
import { FeaturePage } from '../src/components/FeaturePage';
export default function Screen() { return <FeaturePage title={"Privacy & Safety"} intro={"Privacy controls must be enforced by backend policies as well as the interface."} features={[
    { title: "Profile visibility", description: "Plan public and private profile settings." },
    { title: "Per-post identity", description: "Choose whether a post displays your profile identity where the feature and law permit." },
    { title: "Post audience", description: "Public, followers, or private options need database policies." },
    { title: "Safety tools", description: "Blocking, reporting, moderation, and account deletion need server-side implementation." }
  ]} actions={[

  ]} />; }
