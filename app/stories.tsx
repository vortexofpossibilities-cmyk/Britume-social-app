import React from 'react';
import { FeaturePage } from '../src/components/FeaturePage';

export default function Screen() {
return (
<FeaturePage
title="Stories"
intro="A dedicated space for short-lived moments and creator updates."
features={[
{
title: 'Create a story',
description:
'Choose a photo or short video. Media selection, uploading, automatic expiry, and viewer lists require backend integration.',
},
{
title: 'Audience',
description:
'Plan who can view each story: followers, friends, a community, or the public.',
},
]}
/>
);
}
