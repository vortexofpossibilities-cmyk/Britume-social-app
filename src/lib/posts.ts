async function enrichPosts(
  posts: Omit<FeedPost, 'author' | 'media'>[]
): Promise<FeedPost[]> {
  const client = ensureSupabase();

  if (posts.length === 0) return [];

  const postIds = posts.map(post => post.id);
  const authorIds = [...new Set(posts.map(post => post.user_id))];

  const [profilesResult, mediaResult] = await Promise.all([
    client
      .from('profiles')
      .select('user_id, display_name, username, is_public')
      .in('user_id', authorIds),

    client
      .from('post_media')
      .select(
        'id, post_id, user_id, storage_path, media_type, mime_type, position'
      )
      .in('post_id', postIds)
      .order('position', { ascending: true }),
  ]);

  if (profilesResult.error) {
    console.warn('BRITUME profile loading:', profilesResult.error.message);
  }

  if (mediaResult.error) {
    console.error('BRITUME media loading:', mediaResult.error.message);
  }

  const profileMap = new Map<string, ProfileSummary>();

  for (const profile of profilesResult.data ?? []) {
    profileMap.set(profile.user_id, profile as ProfileSummary);
  }

  const mediaByPost = new Map<string, PostMedia[]>();

  if (!mediaResult.error) {
    for (const item of mediaResult.data ?? []) {
      const { data, error } = await client.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(item.storage_path, SIGNED_URL_SECONDS);

      if (error || !data?.signedUrl) {
        console.error(
          'BRITUME could not create media link:',
          item.storage_path,
          error?.message
        );
        continue;
      }

      const mediaItem: PostMedia = {
        ...item,
        url: data.signedUrl,
      } as PostMedia;

      const existing = mediaByPost.get(item.post_id) ?? [];
      existing.push(mediaItem);
      mediaByPost.set(item.post_id, existing);
    }
  }

  return posts.map(post => ({
    ...post,
    author: profileMap.get(post.user_id) ?? null,
    media: mediaByPost.get(post.id) ?? [],
  }));
}
