import React, { useState } from 'react';
import { withFormik, FormikProps, Form, Field } from 'formik';
import { Switch, DatePicker, Button } from 'antd';
import moment from 'moment-timezone';
import { Moment } from 'moment-timezone/moment-timezone';

import * as DfForms from '../../utils/forms';
import { FieldNames } from '../../utils/forms';
import HeadMeta from '../../utils/HeadMeta';
import Section from '../../utils/Section';

import './index.css';
import { buildValidationSchema } from './validation';
import DfMdEditor from 'src/components/utils/DfMdEditor';

export type Company = {
  id: number
  name: string
  img: string
}

type OuterProps = {
  suggestedEmployerTypes?: string[]
  suggestedCompanies?: Company[]
}

// Shape of form values
interface FormValues {
  title: string
  employmentType: string
  company: string
  location: string
  startDate: Moment
  endDate: Moment
  showEndDate: boolean
  description: string
}

type FormProps = OuterProps & FormikProps<FormValues>

const Fields: FieldNames<FormValues> = {
  title: 'title',
  employmentType: 'employmentType',
  company: 'company',
  location: 'location',
  startDate: 'startDate',
  endDate: 'endDate',
  showEndDate: 'showEndDate',
  description: 'description'
}

const LabelledField = DfForms.LabelledField<FormValues>();
const LabelledText = DfForms.LabelledText<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    values,
    errors,
    setFieldValue,
    suggestedEmployerTypes = [],
    suggestedCompanies = []
  } = props;

  const {
    description,
    company,
    startDate,
    endDate,
    showEndDate
  } = values;

  const [ companyLogo, setCompanyLogo ] = useState<string>();
  const [ companyAutocomplete, setCompanyAutocomplete ] = useState<Company[]>([]);

  const handleCompanyChange = (event: React.FormEvent<HTMLInputElement>) => {

    if (!event.currentTarget.value) {
      setCompanyAutocomplete([]);
    }

    setFieldValue(Fields.company, event.currentTarget.value);
    setCompanyLogo(undefined);

    if (company) {
      company.toLowerCase();

      const results = suggestedCompanies.filter(function (item) {
        return item.name.toLowerCase().includes(company);
      });

      if (results) setCompanyAutocomplete(results);
    }
  };

  const handleCompanyAutocomplete = (company: Company) => {
    setFieldValue(Fields.company, company.name);

    setCompanyAutocomplete([]);
    setCompanyLogo(company.img);
  };

  const toggleShowEndDate = () => {
    setFieldValue(Fields.showEndDate, !showEndDate);
  };

  const disabledStartEndDate = (current: Moment | null) => {
    if (!current) return true;

    return moment().diff(current, 'days') <= 0;
  };

  const pageTitle = 'Edit team member'

  return <>
    <HeadMeta title={pageTitle} />
    <Section className='EditEntityBox' title={pageTitle}>
      <Form className='ui form DfForm EditEntityForm'>
        <LabelledText name={Fields.title} label='Title' placeholder='Your title' {...props} />

        <LabelledField name={Fields.employmentType} label='Employment Type' {...props}>
          <Field component='select' name={Fields.employmentType}>
            <option value=''>-</option>
            {
              suggestedEmployerTypes.map((x) => <option key={x} value={x}>{x}</option>)
            }
          </Field>
        </LabelledField>

        <LabelledField name={Fields.company} label='Company' {...props}>
          <div className={`atm_company_wrapper ${companyLogo && 'with_prefix'}`}>
            <Field name={Fields.company}
              type={'text'}
              value={company}
              onChange={handleCompanyChange}
              autoComplete={'off'}
            />
            <div className={'atm_prefix'}>
              <img src={companyLogo} />
            </div>
          </div>
        </LabelledField>

        {/* TODO replace with Ant D. autocomplete */}
        {companyAutocomplete.map((x) => (
          <div
            className={'atm_company_autocomplete'}
            key={`${x.id}`}
            onClick={() => handleCompanyAutocomplete(x)}
          >
            <div className={'atm_company_autocomplete_item'}>
              <img src={x.img} />
              <span>{x.name}</span>
            </div>
          </div>
        ))}

        <LabelledText name={Fields.location} label='Location'
          placeholder='Ex: Berlin, Germany' {...props} />

        <div className={'atm_switch_wrapper'}>
          <Switch onChange={toggleShowEndDate} checked={showEndDate} />
          <div className={'atm_switch_label'}>I am currently working in this role.</div>
        </div>

        <div className={'atm_dates_wrapper'}>

          <LabelledField name={Fields.startDate} label='Start Date' {...props}>
            <DatePicker name={Fields.startDate}
              value={startDate}
              onChange={(date) => setFieldValue(Fields.startDate, date)}
              disabledDate={disabledStartEndDate}
            />
          </LabelledField>

          <LabelledField name={Fields.endDate} label='End Date' {...props}>
          {showEndDate
            ? <div>Present</div>
            : <DatePicker name={Fields.endDate}
                value={endDate}
                onChange={(date) => setFieldValue(Fields.endDate, date)}
                disabledDate={disabledStartEndDate}
              />
          }
          </LabelledField>
        </div>

        <LabelledField name={Fields.description} label='Description' {...props}>
          <Field component={DfMdEditor}
            name={Fields.description}
            value={description}
            onChange={(data: string) => setFieldValue(Fields.description, data)}
            className={`DfMdEditor ${errors[Fields.description] && 'error'}`} />
        </LabelledField>

        {/* TODO replace with TxButton */}
        <Button type='primary' htmlType='submit' disabled={false} className={'atm_submit_button'}>
          Save
        </Button>
      </Form>
    </Section>
  </>;
};

// Wrap our form with the with Formik HoC
export const EditTeamMember = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: () => {
    return {
      title: '',
      description: '',
      employmentType: '',
      company: '',
      location: '',
      startDate: moment(new Date()).add(-1, 'days'),
      endDate: moment(),
      showEndDate: true
    };
  },

  validationSchema: buildValidationSchema,

  handleSubmit: () => {
    // console.log(values)
  }
})(InnerForm);

export default EditTeamMember;
