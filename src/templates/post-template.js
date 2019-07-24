import React from 'react';
import { graphql } from 'gatsby';
import Layout from '../components/Layout';
import Post from '../components/Post';
import { useSiteMetadata } from '../hooks';
import type { MarkdownRemark } from '../types';

type Props = {
  data: MarkdownRemark,
};

const PostTemplate = ({ data }: Props) => {
  const { title: siteTitle, subtitle: siteSubtitle, url } = useSiteMetadata();
  const {
    title: postTitle,
    description: postDescription,
  } = data.markdownRemark.frontmatter;
  const metaDescription =
    postDescription !== null ? postDescription : siteSubtitle;

  const { slug } = data.markdownRemark.fields;
  const { canonical } = data.markdownRemark.frontmatter;
  data.markdownRemark.frontmatter.canonical = canonical || `${url}${slug}`;

  return (
    <Layout title={`${postTitle} - ${siteTitle}`} description={metaDescription}>
      <Post post={data.markdownRemark} />
    </Layout>
  );
};

export const query = graphql`
  query PostBySlug($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      html
      fields {
        slug
        tagSlugs
      }
      frontmatter {
        date
        description
        tags
        title
        canonical
      }
    }
  }
`;

export default PostTemplate;
