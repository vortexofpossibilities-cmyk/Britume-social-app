import React from 'react';
import { FeaturePage } from '../src/components/FeaturePage';
export default function Screen() { return <FeaturePage title={"Dashboard"} intro={"A central overview for members and creators."} features={[
    { title: "Activity", description: "Posts, followers, group activity and engagement summaries." },
    { title: "Creator tools", description: "Content management and performance insights." },
    { title: "Data status", description: "Live analytics are not available until connected to real backend data." }
  ]} actions={[

  ]} />; }
