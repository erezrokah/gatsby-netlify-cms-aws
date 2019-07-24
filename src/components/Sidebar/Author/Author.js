// @flow
import React from 'react';
import { Link, useStaticQuery, graphql } from 'gatsby';
import Img from 'gatsby-image';
import styles from './Author.module.scss';

type AuthorType = {
  name: string,
  bio: string,
};

type Props = {
  author: AuthorType,
  isIndex: ?boolean,
};

const query = graphql`
  query {
    file(relativePath: { eq: "images/author.jpg" }) {
      childImageSharp {
        fixed(width: 75, height: 75) {
          ...GatsbyImageSharpFixed
        }
      }
    }
  }
`;

const AuthorImg = ({ author }: { author: AuthorType }) => {
  const data = useStaticQuery(query);
  return (
    <Img
      fixed={data.file.childImageSharp.fixed}
      alt={author.name}
      className={styles['author__photo']}
    />
  );
};

const Author = ({ author, isIndex }: Props) => (
  <div className={styles['author']}>
    <Link to="/">
      <AuthorImg author={author} />
    </Link>

    {isIndex ? (
      <h1 className={styles['author__title']}>
        <Link className={styles['author__title-link']} to="/">
          {author.name}
        </Link>
      </h1>
    ) : (
      <h2 className={styles['author__title']}>
        <Link className={styles['author__title-link']} to="/">
          {author.name}
        </Link>
      </h2>
    )}
    <p className={styles['author__subtitle']}>{author.bio}</p>
  </div>
);

export default Author;
