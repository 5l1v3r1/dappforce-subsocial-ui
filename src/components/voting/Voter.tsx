import React, { useEffect, useState } from 'react';
import { Button } from 'semantic-ui-react';

import dynamic from 'next/dynamic';
import { useMyAccount } from '../utils/MyAccountContext';
import { CommentVoters, PostVoters } from './ListVoters';
import { Post, Reaction, Comment } from '@subsocial/types/substrate/interfaces/subsocial';
import BN from 'bn.js';
import { ReactionKind } from '@subsocial/types/substrate/classes';
import { useSubsocialApi } from '../utils/SubsocialApiContext';
import { newLogger } from '@subsocial/utils';
const TxButton = dynamic(() => import('../utils/TxButton'), { ssr: false });

const log = newLogger('Voter')

const ZERO = new BN(0);

type VoterProps = {
  struct: Comment | Post,
  type: 'Comment' | 'Post'
};

export const Voter = (props: VoterProps) => {
  const {
    struct,
    type
  } = props;

  const { substrate } = useSubsocialApi()
  const [ reactionState, setReactionState ] = useState(undefined as (Reaction | undefined));

  const { state: { address } } = useMyAccount();

  const kind = reactionState ? reactionState && reactionState.kind.toString() : 'None';
  const [ reactionKind, setReactionKind ] = useState(kind);
  const [ state, setState ] = useState(struct);
  const [ updateTrigger, setUpdateTrigger ] = useState(true);
  const { id } = state;
  const isComment = type === 'Comment';

  useEffect(() => {
    let isSubscribe = true;

    async function loadStruct<T extends Comment | Post> (_: T) {
      const _struct = isComment
        ? await substrate.findComment(id)
        : await substrate.findPost(id)
      if (isSubscribe && _struct) setState(_struct);
    }
    loadStruct(state).catch(err => log.error('Failed to load a post or comment. Error:', err));

    async function loadReaction () {
      if (!address) return

      const reactionId = isComment
        ? await substrate.getCommentReactionIdByAccount(address, id)
        : await substrate.getPostReactionIdByAccount(address, id)
      const reaction = await substrate.findReaction(reactionId)
      if (isSubscribe) {
        setReactionState(reaction);
        reaction && setReactionKind(reaction.kind.toString());
      } 
    }

    loadReaction().catch(err => log.error('Failed to load a reaction. Error:', err));

    return () => { isSubscribe = false; };
  }, [ updateTrigger, address ]);

  const buildTxParams = (param: 'Downvote' | 'Upvote') => {
    if (reactionState === undefined) {
      return [ id, new ReactionKind(param) ];
    } else if (reactionKind !== param) {
      return [ id, reactionState.id, new ReactionKind(param) ];
    } else {
      return [ id, reactionState.id ];
    }
  };

  const VoterRender = () => {
    let countColor = '';

    const calcVotingPercentage = () => {
      const { downvotes_count, upvotes_count } = state;
      const upvotesCount = new BN(upvotes_count);
      const downvotesCount = new BN(downvotes_count);
      const totalCount = upvotesCount.add(downvotesCount);
      if (totalCount.eq(ZERO)) return 0;

      const per = upvotesCount.toNumber() / totalCount.toNumber() * 100;
      const ceilPer = Math.ceil(per);

      if (per >= 50) {
        countColor = 'green';
        return ceilPer;
      } else {
        countColor = 'red';
        return 100 - ceilPer;
      }
    };

    const [ open, setOpen ] = useState(false);
    const close = () => setOpen(false);

    const renderTxButton = (isUpvote: boolean) => {
      const reactionName = isUpvote ? 'Upvote' : 'Downvote';
      const color = isUpvote ? 'green' : 'red';
      const isActive = (reactionKind === reactionName) && 'active';
      const icon = `thumbs ${isUpvote ? 'up' : 'down'} outline`;

      return (<TxButton
        type='submit'
        icon={icon}
        className={`${color} ${isActive}`}
        params={buildTxParams(reactionName)}
        onSuccess={() => setUpdateTrigger(!updateTrigger)}
        tx={!reactionState
          ? `social.create${type}Reaction`
          : (reactionKind !== `${reactionName}`)
            ? `social.update${type}Reaction`
            : `social.delete${type}Reaction`}
      />);
    };

    const count = calcVotingPercentage();

    return <>
      <Button.Group className={`DfVoter`}>
        {renderTxButton(true)}
        <Button content={ count === 0 ? count.toString() : count + '%' } variant='primary' className={`${countColor} active`} onClick={() => setOpen(true)}/>
        {renderTxButton(false)}
      </Button.Group>
      {isComment
        ? open && <CommentVoters id={id} open={open} close={close}/>
        : open && <PostVoters id={id} open={open} close={close}/>}
    </>;
  };

  return <VoterRender/>;
};

export default Voter;
