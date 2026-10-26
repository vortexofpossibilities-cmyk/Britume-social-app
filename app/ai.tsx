import React from 'react';
import { FeaturePage } from '../src/components/FeaturePage';
export default function Screen() { return <FeaturePage title={"BRITUME AI"} intro={"Your creative and learning partner across study, coding and content creation."} features={[
    { title: "Study helper", description: "Revision plans, explanations and practice questions." },
    { title: "Creative partner", description: "Brainstorm captions, music concepts and ideas." },
    { title: "Coding helper", description: "Explain code and help debug project issues." },
    { title: "Service connection", description: "No AI model is wired into this screen yet. Configure a secure server-side provider; never place private API keys in the app." }
  ]} actions={[

  ]} />; }
