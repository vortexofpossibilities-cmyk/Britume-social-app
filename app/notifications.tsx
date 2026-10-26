import React from 'react';
import { FeaturePage } from '../src/components/FeaturePage';
export default function Screen() { return <FeaturePage title={"Notifications"} intro={"One place for account and community activity."} features={[
    { title: "Social alerts", description: "Likes, comments, follows and mentions." },
    { title: "Community alerts", description: "Group invitations, announcements and moderation actions." },
    { title: "Delivery", description: "Push notifications require device setup and a notification service." }
  ]} actions={[

  ]} />; }
