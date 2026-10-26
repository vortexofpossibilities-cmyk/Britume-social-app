import React from 'react';
import { FeaturePage } from '../src/components/FeaturePage';
export default function Screen() { return <FeaturePage title={"Stories"} intro={"A dedicated space for short-lived moments and creator updates."} features={[
    { title: "Create a story", description: "Choose a photo or short video in a future media picker. Upload, expiry, and viewer list still require backend integration." },
    { title: "Audience", description: "Plan who can view each story: followers, friends, a community, or public." }
  ]} actions={[

  ]} />; }
