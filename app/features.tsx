import React from 'react';
import { FeaturePage } from '../src/components/FeaturePage';
export default function Screen() { return <FeaturePage title={"BRITUME Features"} intro={"Your app areas are separated into their own screens. Connect backend services before treating service-dependent features as live."} features={[
    { title: "Stories", description: "Create and view temporary moments. Media upload, expiry rules, and audience controls require backend/storage integration." },
    { title: "Communities", description: "Discover or create interest groups; official organization badges require verification workflows." },
    { title: "Messages", description: "Private conversations and voice notes need secure message storage and realtime delivery." },
    { title: "Notifications", description: "A home for follows, likes, comments, group activity, and account alerts." },
    { title: "BRITUME AI", description: "Study, coding, captions, creative ideas, and music prompts. Requires a configured AI service." },
    { title: "Studio", description: "A planned creator workspace for beats, recording, and music projects; audio engine is not yet implemented." },
    { title: "Games", description: "Game launcher concept for Ludo, chess, Sudoku, pool, cards, football and more; actual games need implementation." },
    { title: "Competitions", description: "Challenges, submissions, judging and leaderboards need rules and backend workflows." },
    { title: "Dashboard", description: "Account and creator activity overview; live metrics require real data." }
  ]} actions={[
    { label: "Open Stories", route: "/stories" },
    { label: "Communities", route: "/communities" },
    { label: "Messages", route: "/messages" },
    { label: "Notifications", route: "/notifications" },
    { label: "BRITUME AI", route: "/ai" },
    { label: "Studio", route: "/studio" },
    { label: "Games", route: "/games" },
    { label: "Competitions", route: "/competitions" },
    { label: "Dashboard", route: "/dashboard" },
    { label: "Privacy controls", route: "/privacy" }
  ]} />; }
