import React from 'react';
import { FeaturePage } from '../src/components/FeaturePage';
export default function Screen() { return <FeaturePage title={"Communities"} intro={"Find people around shared interests, learning, creativity and local groups."} features={[
    { title: "Discover groups", description: "Search and browse groups by topic." },
    { title: "Create a community", description: "Community creation form and database write need to be connected." },
    { title: "Official organizations", description: "Verification and official badges must be reviewed before publication." }
  ]} actions={[

  ]} />; }
