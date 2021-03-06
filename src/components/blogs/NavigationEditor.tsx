import React, { useState, useEffect } from 'react';
import { Button } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps, FieldArray } from 'formik';
import { Option } from '@polkadot/types';
import Section from '../utils/Section';
import { socialQueryToProp } from '../utils/index';
import { getNewIdFromEvent, Loading } from '../utils/utils';
import { useMyAddress } from '../utils/MyAccountContext';
import Router from 'next/router';
import HeadMeta from '../utils/HeadMeta';
import { AutoComplete, Switch, Affix, Alert } from 'antd';
import Select, { SelectValue } from 'antd/lib/select';
import EditableTagGroup from '../utils/EditableTagGroup';
import ReorderNavTabs from '../utils/ReorderNavTabs';
import { SubmittableResult } from '@polkadot/api';
import dynamic from 'next/dynamic';
import { withBlogIdFromUrl } from './withBlogIdFromUrl';
import { validationSchema } from './NavValidation';
import BloggedSectionTitle from '../blogs/BloggedSectionTitle';
import { Blog } from '@subsocial/types/substrate/interfaces';
import { BlogContent, NavTab } from '@subsocial/types/offchain';
import { BlogUpdate, OptionText } from '@subsocial/types/substrate/classes';
import { withMulti, withCalls, registry } from '@polkadot/react-api';
import BN from 'bn.js'
import { useSubsocialApi } from '../utils/SubsocialApiContext';
import DfMdEditor from '../utils/DfMdEditor';

const TxButton = dynamic(() => import('../utils/TxButton'), { ssr: false });

export interface FormValues {
  navTabs: NavTab[]
}

interface OuterProps {
  struct: Blog;
  json: BlogContent;
  id: BN;
}

const InnerForm = (props: OuterProps & FormikProps<FormValues>) => {
  const {
    values,
    errors,
    touched,
    setFieldValue,
    isValid,
    isSubmitting,
    setSubmitting,
    struct,
    id,
    json
  } = props;

  const {
    navTabs
  } = values;

  const {
    desc,
    image,
    tags: blogTags = [],
    name
  } = json

  const getMaxId = (): number => {
    if (navTabs.length === 0) return 0

    const x = navTabs.reduce((cur, prev) => (cur.id > prev.id ? cur : prev))
    return x.id
  }
  const typesOfContent = [ 'url', 'by-tag' ]

  const defaultTab = { id: getMaxId() + 1, title: '', type: 'url', description: '', content: { data: '' }, hidden: false }

  const renderValueField = (nt: NavTab, index: number) => {
    switch (nt.type) {
      case 'url': {
        const url = nt.content.data ? nt.content.data : ''
        return (
          <Field
            type="text"
            name={`nt.${index}.content.data`}
            value={url}
            onChange={(e: React.FormEvent<HTMLInputElement>) => setFieldValue(`navTabs.${index}.content.data`, e.currentTarget.value)}
          />
        )
      }
      case 'by-tag': {
        const tags = nt.content.data as string[] || []
        return (
          <div className="NETagsWrapper">
            <EditableTagGroup
              name={`navTabs.${index}.content.data`}
              tags={tags}
              tagSuggestions={blogTags}
              setFieldValue={setFieldValue}
            />
          </div>
        )
      }
      default: {
        return undefined
      }
    }
  }

  const handleSaveNavOrder = (tabs: NavTab[]) => {
    setFieldValue('navTabs', tabs)
  }

  const handleTypeChange = (e: SelectValue, index: number) => {
    setFieldValue(`navTabs.${index}.type`, e)
    setFieldValue(`navTabs.${index}.content.data`, '')
  }

  const renderError = (index: number, name: keyof NavTab) => {
    if (touched &&
      errors.navTabs && errors.navTabs[index]?.[name]) {
      return <div className='ui pointing red label NEErrorMessage'>{errors.navTabs[index]?.[name]}</div>
    }
    return null
  }

  const { ipfs } = useSubsocialApi()
  const [ ipfsCid, setIpfsCid ] = useState('');

  const onSubmit = (sendTx: () => void) => {
    if (isValid) {
      const json = {
        navTabs,
        name,
        desc,
        image,
        tags: blogTags
      };
      ipfs.saveBlog(json).then(cid => {
        if (cid) {
          console.log('Nav editor IPFS CID:', cid)
          setIpfsCid(cid.toString());
          sendTx();
        }
      }).catch(err => new Error(err));
    }
  };

  const onTxFailed = () => {
    ipfs.removeContent(ipfsCid).catch(err => new Error(err));
    setSubmitting(false);
  };

  const onTxSuccess = (_txResult: SubmittableResult) => {
    setSubmitting(false);

    const _id = id || getNewIdFromEvent(_txResult);
    console.log('onTxSuccess _id:', _id)
    _id && goToView(_id);
  };

  const goToView = (id: BN) => {
    Router.push('/blogs/' + id.toString()).catch(console.log);
  };

  const buildTxParams = () => {
    if (!isValid || !struct) return [];

    const update = new BlogUpdate({
      writers: new Option(registry, 'Vec<AccountId>', []),
      handle: new Option(registry, 'Option<Text>', new Option(registry, 'Text', null)),
      ipfs_hash: new OptionText(ipfsCid)
    });
    return [ struct.id, update ];
  };

  const pageTitle = `Edit blog navigation`

  const sectionTitle =
    <BloggedSectionTitle blogId={struct.id} title={pageTitle} />

  return <>
    <HeadMeta title={pageTitle} />
    <div className='NavEditorWrapper'>
      <Section className='EditEntityBox NavigationEditor' title={sectionTitle}>
        <Form className='ui form DfForm NavigationEditorForm'>
          <FieldArray
            name="navTabs"
            render={arrayHelpers => (
              <div>
                {values.navTabs && values.navTabs.length > 0 && (
                  values.navTabs.map((nt, index) => (
                    <div className={`NERow ${(nt.hidden ? 'NEHidden' : '')}`} key={nt.id}>

                      <div className="NEText">Tab name:</div>
                      <Field
                        type="text"
                        name={`nt.${index}.title`}
                        placeholder="Tab name"
                        style={{ maxWidth: '30rem' }}
                        value={nt.title}
                        onChange={(e: React.FormEvent<HTMLInputElement>) => setFieldValue(`navTabs.${index}.title`, e.currentTarget.value)}
                      />
                      {renderError(index, 'title')}

                      <div className="NEText">Type of content:</div>
                      <Field
                        component={Select}
                        name={`nt.${index}.type`}
                        defaultValue={nt.type}
                        onChange={(e: SelectValue) => handleTypeChange(e, index)}
                        className={'NESelectType'}
                      >
                        {
                          typesOfContent.map((x) => <AutoComplete.Option key={x} value={x}>{x}</AutoComplete.Option>)
                        }
                      </Field>

                      <div className="NEText">Value:</div>
                      {renderValueField(nt, index)}

                      <div className="NEText">Description:</div>
                      <Field
                        component={DfMdEditor}
                        name={`navTabs.${index}.description`} value={nt.description}
                        onChange={(data: string) => setFieldValue(`navTabs.${index}.description`, data)}
                        className={`DfMdEditor NETextEditor`} />

                      <div className="NEButtonsWrapper">
                        <div className="NEHideButton">
                          <Switch onChange={() => setFieldValue(`navTabs.${index}.hidden`, !nt.hidden)} />
                          Don't show this tab in blog navigation
                        </div>
                        <div className="NERemoveButton">
                          <Button type="default" onClick={() => arrayHelpers.remove(index)}>Delete tab</Button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
                <div className="NERow">
                  <div
                    className="NEAddTab"
                    onClick={() => { arrayHelpers.push(defaultTab) }}
                  >
                    + Add Tab
                  </div>
                </div>
              </div>
            )}
          />

          <TxButton
            type='button'
            size='medium'
            label={'Update Navigation'}
            isDisabled={!isValid || isSubmitting}
            params={buildTxParams()}
            tx={'social.updateBlog'}
            onClick={onSubmit}
            onFailed={onTxFailed}
            onSuccess={onTxSuccess}
          />

        </Form>
      </Section>

      <Affix offsetTop={80}>
        <div style={{ marginLeft: '2rem', minWidth: '300px' }}>
          <Alert type="info" showIcon closable message="Drag tabs to reorder them." style={{ marginBottom: '1rem' }} />
          <ReorderNavTabs tabs={navTabs} onChange={(tabs: NavTab[]) => handleSaveNavOrder(tabs)} />
        </div>
      </Affix>
    </div>
  </>
}

export interface NavEditorFormProps {
  struct: Blog;
  json: BlogContent;
  id: BN;
}

export const NavigationEditor = withFormik<NavEditorFormProps, FormValues>({
  mapPropsToValues: props => {
    const { json } = props;
    if (json && json.navTabs) {
      return {
        navTabs: json.navTabs
      };
    } else {
      return {
        navTabs: []
      };
    }
  },

  validationSchema,

  handleSubmit: values => {
    console.log(values)
  }
})(InnerForm);

type LoadStructProps = OuterProps & {
  structOpt: Option<Blog>;
};

// TODO refactor copypasta. See the same function in EditBlog
function LoadStruct (props: LoadStructProps) {
  const myAddress = useMyAddress()
  const { ipfs } = useSubsocialApi()
  const { structOpt } = props;
  const [ json, setJson ] = useState<BlogContent>();
  const [ struct, setStruct ] = useState<Blog>();
  const [ trigger, setTrigger ] = useState(false);
  const jsonIsNone = json === undefined;

  const toggleTrigger = () => {
    json === undefined && setTrigger(!trigger);
  };

  useEffect(() => {
    if (!myAddress || !structOpt || structOpt.isNone) return toggleTrigger();

    setStruct(structOpt.unwrap());

    if (struct === undefined) return toggleTrigger();

    console.log('Loading blog JSON from IPFS');
    ipfs.findBlog(struct.ipfs_hash.toString()).then(json => {
      setJson(json);
    }).catch(err => console.log(err));
  }, [ trigger ]);

  if (!myAddress || !structOpt || jsonIsNone) {
    return <Loading />;
  }

  if (!struct || !struct.created.account.eq(myAddress)) {
    return <em>You have no rights to edit this blog</em>;
  }

  if (structOpt.isNone) {
    return <em>Blog not found...</em>;
  }

  return <NavigationEditor {...props} struct={struct} json={json as BlogContent} />;
}

export const EditNavigation = withMulti(
  LoadStruct,
  withBlogIdFromUrl,
  withCalls<OuterProps>(
    socialQueryToProp('blogById', { paramName: 'id', propName: 'structOpt' })
  )
);

export default EditNavigation;
