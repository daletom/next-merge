import { useRouter } from 'next/router'
import MoreCategories from "@/components/more-categories";
//import HeroPost from "@/components/hero-post";
import Intro from "@/components/intro";
import Layout from "@/components/layout";
//import { getAllPostsForHome } from "@/lib/api";
import { getCategoriesSlug, getAllImagePosts } from "@/lib/api";
import Head from "next/head";
import useSWR from "swr";
import _ from "lodash";
import { getMergeId, combineMergeContent } from "@/lib/merge";
import RemoveMergeContentBanner from "@/components/remove-merge-content-banner";
import { Post } from "interfaces";
import dynamic from "next/dynamic";
import { getAllPostsWithSlug, getPostAndMorePosts } from '@/lib/api'
import markdownToHtml from '@/lib/markdownToHtml'

const fetcher = url => fetch(url).then(r => r.json())

const DynamicContainer = dynamic(() => import("@/components/container"), {
  ssr: false,
});

type IndexProps = {
  allPosts: Post[];
  posts: any;
  preview: boolean;
};

const Index = (props: IndexProps) => {
  let { posts, preview } = props;
  const merge_id = getMergeId();

  const { data: mergePosts } = useSWR(
    merge_id ? `/api/get-merge-request-posts/${merge_id}` : null,
    fetcher
  );


  if (mergePosts) {
    posts = combineMergeContent(posts, mergePosts, true);
  }

  const loadingMerge = merge_id && !mergePosts;

  posts = _.orderBy(posts, ["created_at"], ["desc"]);
  const morePosts = posts;
  return (
    <div>
      <Layout preview={preview}>
        <Head>
          <title>imgix Demo Site</title>
        </Head>
        <DynamicContainer>
          {merge_id && <RemoveMergeContentBanner />}
          {loadingMerge ? (
            <h1 className="mt-12 text-4xl font-bold leading-tight tracking-tighter text-center">
              Loading Merge Preview...
            </h1>
          ) : (
            <div>
              <Intro />
              
              {morePosts.length > 0 && <MoreCategories posts={morePosts} />}
            </div>
          )}
        </DynamicContainer>
      </Layout>
    </div>
  );
};

export default Index;

type staticProps = {
  preview: boolean;
  params: any;
  slug: string;
};

export const getStaticProps = async (props: staticProps) => {
  let {
    params,
    preview = null
  } = props;
  const data = await getCategoriesSlug(params.slug)
  //const content = await markdownToHtml(data['post']?.metadata?.content || '')
  return {
    props: {
      preview,
      slug: params.slug,
      posts: {
        ...data,
      },
      //morePosts: data['morePosts'] || [],
    },
    revalidate: 10,
  }
}

export const getStaticPaths = async (props: staticProps) => {
  const { preview = null, slug } = props;
  const allPosts = (await getAllImagePosts(true, slug)) || []
  return {
    paths: allPosts.map((post) => `/categories/${post.metadata.category2.value}`),
    fallback: true,
  }
}
