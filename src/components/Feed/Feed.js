// @flow
import React from 'react';
import { format } from 'date-fns/esm';
import { Link } from 'gatsby';
import type { Edges } from '../../types';
import styles from './Feed.module.scss';

type Props = {
  edges: Edges,
};

const Feed = ({ edges }: Props) => {
  return (
    <div className={styles['feed']}>
      {edges.map((edge) => {
        const date = new Date(edge.node.frontmatter.date);
        return (
          <div className={styles['feed__item']} key={edge.node.fields.slug}>
            <div className={styles['feed__item-meta']}>
              <time
                className={styles['feed__item-meta-time']}
                dateTime={format(date, 'MMMM d, yyyy')}
              >
                {format(date, 'MMMM yyyy')}
              </time>
              <span className={styles['feed__item-meta-divider']} />
              <span className={styles['feed__item-meta-category']}>
                <Link
                  to={edge.node.fields.categorySlug}
                  className={styles['feed__item-meta-category-link']}
                >
                  {edge.node.frontmatter.category}
                </Link>
              </span>
            </div>
            <h2 className={styles['feed__item-title']}>
              <Link
                className={styles['feed__item-title-link']}
                to={edge.node.fields.slug}
              >
                {edge.node.frontmatter.title}
              </Link>
            </h2>
            <p className={styles['feed__item-description']}>
              {edge.node.frontmatter.description}
            </p>
            <Link
              className={styles['feed__item-readmore']}
              to={edge.node.fields.slug}
            >
              Read
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default Feed;
