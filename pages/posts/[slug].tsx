import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import PostBody from '@/components/post-body'
import PostEmbed from '@/components/post-embed'
import MoreDemos from '@/components/more-demos'
import PostHeader from '@/components/post-header'
import SectionSeparator from '@/components/section-separator'
import Layout from '@/components/layout'
import { getAllPostsWithSlug, getPostAndMorePosts } from '@/lib/api'
import PostTitle from '@/components/post-title'
import Head from 'next/head'

import markdownToHtml from '@/lib/markdownToHtml'
import useSWR from 'swr'
import _ from 'lodash'
import { getMergeId, combineMergeContent } from '@/lib/merge'
import RemoveMergeContentBanner from '@/components/remove-merge-content-banner'
import { Post } from 'interfaces'
import { ParsedUrlQueryInput } from 'querystring'
import dynamic from 'next/dynamic'

const fetcher = url => fetch(url).then(r => r.json())

const DynamicContainer = dynamic(() => import('@/components/container'), {
  ssr: false,
})

type PostProps = {
  post: Post;
  morePosts: Post[];
  preview: boolean;
};

const Post = (props: PostProps) => {
  let {
    post,
    morePosts,
    preview
  } = props;

  const router = useRouter()
  const { slug } = router.query
  const merge_id = getMergeId()

    // Check for has merge post
    const { data: mergePost } = useSWR(
      merge_id ? `/api/get-merge-request-posts/${merge_id}/${slug}` : null,
      fetcher
    );

    if (mergePost && mergePost.status !== 404) {
      post = mergePost
      // @ts-ignore
      delete router.isFallback
    }
  
    // Check for has merge posts
    const { data: mergePosts } = useSWR(
      merge_id ? `/api/get-merge-request-posts/${merge_id}/` : null,
      fetcher
    );

    if (mergePosts) {
      morePosts = combineMergeContent(morePosts, mergePosts, true)
    }
  
  if (merge_id && !post?.slug) {
    // @ts-ignore
    router.isFallback = true;
  }
  if (!router.isFallback && !post?.slug)
    return <ErrorPage statusCode={404} />

  return (
    <div>
      <Layout preview={preview}>
        <DynamicContainer>
          {
            merge_id &&
            <RemoveMergeContentBanner />
          }
          {router.isFallback ? (
            <PostTitle>Loading…</PostTitle>
          ) : (
            <div>
              <article>
                <Head>
                  <title>
                    {Post['title']} | imgix Demo Site
                  </title>
                  <meta
                    name="title"
                    content={post.title}
                   />
                  <meta
                    name="description"
                    content={post.metadata.excerpt}
                   />
                   <meta
                    name="twitter:title"
                    content={post.title}
                   />
                   <meta
                    name="twitter:description"
                    content={post.metadata.excerpt}
                   />
                  <meta
                    property="og:image"
                    content="https://cosmicjs.imgix.net/ccd3a770-2e39-11ed-9dcf-4f97d8f41281-Screen-Shot-2022-09-06-at-4.15.20-PM.png?blend-align=bottom&blend-mode=normal&blend64=aHR0cHM6Ly90b20uaW1naXgubmV0LzF4MV9tb3RpZi5wbmc_dz0xMjAwJmg9NzUmYmc9ZmZmJmZpdD1jcm9w&mark64=aHR0cHM6Ly90b20uaW1naXgubmV0LzF4MV9tb3RpZi5wbmc_bWFyay1wYWQ9LTImZml0PWNyb3AmaD02MzAmdz0xMjAwJm1hcms2ND1hSFIwY0hNNkx5OXBlQzEzZDNjdWFXMW5hWGd1Ym1WMEwzQnlaWE56TDJsdFoybDRMWEJ5WlhOekxXdHBkQzV3WkdZX2NHRm5aVDB6Sm1adFBYQnVaeVpvUFRjdyZtYXJrLWFsaWduPWJvdHRvbSUyQ2NlbnRlciZibGVuZDY0PWFIUjBjSE02THk5MGIyMHVhVzFuYVhndWJtVjBMMmR5WVdScFpXNTBMbkJ1Wno5M1BURXlNREFtYUQwMk16QW1abWwwUFdOeWIzQQ&crop=faces%2Cedges&fit=crop&h=630&w=1200&mark-align=bottom%2Ccenter&txt64=TXkgVGl0bGUgSGVyZQ&txt-size=72&txt-align=top%2Cleft&txt-pad=10&txt-line=1&txt-line-color=black&txt-color=white"
                  />
                </Head>
                <PostHeader
                  title={post.title}
                  coverImage={post.metadata.cover_image}
                  excerpt={post.metadata.excerpt}
                  author={post.metadata.author}
                />
                <PostEmbed
                  embed={post.metadata.embed}
                />
                <PostBody content={post['content']} />
              </article>
              <SectionSeparator />
              {morePosts.length > 0 && <MoreDemos posts={morePosts} />}
            </div>
          )}
        </DynamicContainer>
      </Layout>
    </div>
  )
}

type staticProps = {
  params: ParsedUrlQueryInput;
  preview: boolean;
}

export const getStaticProps = async (props: staticProps) => {
  let {
    params,
    preview = null
  } = props;
  const data = await getPostAndMorePosts(params.slug as string, preview)
  const content = await markdownToHtml(data['post']?.metadata?.content || '')
  return {
    props: {
      preview,
      post: {
        ...data['post'],
        content,
      },
      morePosts: data['morePosts'] || [],
    },
    revalidate: 10,
  }
}

export const getStaticPaths = async () => {
  const allPosts = (await getAllPostsWithSlug()) || []
  return {
    paths: allPosts.map((post) => `/posts/${post.slug}`),
    fallback: true,
  }
}

export default Post;