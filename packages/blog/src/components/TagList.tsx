import React from 'react';
import Tag from './Tag';
import { TagListProps } from '../types/componentProps';

const TagList = ({ tags }: TagListProps) => {
  return (
    <div className="flex flex-wrap">
      {tags.map((tag) => (
        <Tag key={tag.tag} tag={tag.displayName} count={tag.count} />
      ))}
    </div>
  );
};

export default TagList;
