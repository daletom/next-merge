import MoreDemos from "@/components/more-demos";
//import HeroPost from "@/components/hero-post";
import Intro from "@/components/intro";
import Layout from "@/components/layout";
import { getAllPostsForHome } from "@/lib/api";
//import { getAllImagePosts } from "@/lib/api";
import Head from "next/head";
import useSWR from "swr";
import _ from "lodash";
import { getMergeId, combineMergeContent } from "@/lib/merge";
import RemoveMergeContentBanner from "@/components/remove-merge-content-banner";
import { Post } from "interfaces";
import dynamic from "next/dynamic";

const fetcher = url => fetch(url).then(r => r.json())

const DynamicContainer = dynamic(() => import("@/components/container"), {
  ssr: false,
});

type IndexProps = {
  allPosts: Post[];
  preview: boolean;
};

const Index = (props: IndexProps) => {
  let { allPosts, preview } = props;
  const merge_id = getMergeId();

  const { data: mergePosts } = useSWR(
    merge_id ? `/api/get-merge-request-posts/${merge_id}` : null,
    fetcher
  );

  if (mergePosts) {
    allPosts = combineMergeContent(allPosts, mergePosts, true);
  }

  const loadingMerge = merge_id && !mergePosts;

  allPosts = _.orderBy(allPosts, ["created_at"], ["desc"]);
  const morePosts = allPosts;

  return (
    <div>
      <Layout preview={preview}>
        <Head>
          <title>imgix Demo Site</title>
          <meta
            name="description"
            content={`A Website to Display imgix Demos.`}
          />
          <meta property="og:image" content="https://assets.imgix.net/og/mountains.jpg?auto=format&markpad=0&blend64=MzM1YjgxOWQ&bm=screen&txtalign=center&txtpad=80&txtfit=max&txtsize=36&txtclr=fff&txtfont64=QXZlbmlyIE5leHQgRGVtaSwgQm9sZA&q=99&markalign=middle%2C%20center&mark64=aHR0cHM6Ly9hc3NldHMuaW1naXgubmV0L3ByZXNza2l0L2ltZ2l4LXByZXNza2l0LnBkZj9peGxpYj1yYi0xLjEuMCZ3PTY0MCZmbT1wbmcmcGFnZT00&w=1200&fit=crop&h=630&txt64=VGhlIGVuZC10by1lbmQgcGxhdGZvcm0gZm9yIHZpc3VhbCBtZWRpYSBwcm9jZXNzaW5n" />
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
              {morePosts.length > 0 && <MoreDemos posts={morePosts} />}
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
};

export const getStaticProps = async (props: staticProps) => {
  const { preview = null } = props;
  const allPosts = (await getAllPostsForHome(preview)) || [];
  return {
    props: { allPosts, preview },
    revalidate: 10,
  };
};