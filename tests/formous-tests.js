import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';

import Formous from '../src/formous';

function createFormComponent(options) {
  const Component = (props) => {
    return (
      <div>
        <button
          onClick={props.formSubmit(props.onSubmit)}>
          submit
        </button>
      </div>
    );
  };
  return Formous(options)(Component);
}

const requiredField = {
  critical: true,
  failProps: { error: 'Field is required' },
  test(value) {
    return value !== '';
  },
};

describe('Formous', () => {
  it('has an untouched valid form when submitted', (done) => {
    const options = {
      fields: {},
    };
    const Form = createFormComponent(options);
    const wrapper = mount(<Form onSubmit={(formStatus) => {
      expect(formStatus.valid).to.be.true;
      expect(formStatus.touched).to.be.fale;
      done();
    }} />);
    wrapper.find('button').first().simulate('click');
  });

  it('runs validation on submit', (done) => {
    const options = {
      fields: {
        name: {
          tests: [
            {
              critical: true,
              failProps: {},
              test: () => false,
            },
          ],
        },
      },
    };
    const Form = createFormComponent(options);
    const wrapper = mount(<Form onSubmit={(formStatus) => {
      expect(formStatus.valid).to.be.false;
      done();
    }} />);
    wrapper.find('button').first().simulate('click');
  });

  it('does not block submit when non-critical tests fail', (done) => {
    const options = {
      fields: {
        name: {
          tests: [
            {
              critical: false,
              failProps: {},
              test: () => false,
            },
          ],
        },
      },
    };
    const Form = createFormComponent(options);
    const wrapper = mount(<Form onSubmit={(formStatus) => {
      expect(formStatus.valid).to.be.true;
      done();
    }} />);
    wrapper.find('button').first().simulate('click');
  });

  it('sets default values', (done) => {
    const options = {
      fields: {
        name: {
          tests: [
            {
              critical: false,
              failProps: {},
              test: () => true,
            },
          ],
        },
      },
    };
    const name = 'default name';
    const Component = React.createClass({
      componentWillMount() {
        this.props.setDefaultValues({
          name,
        });
      },
      render() {
        return (
          <div>
            <button
              onClick={this.props.formSubmit(this.props.onSubmit)}>
              submit
            </button>
          </div>
        );
      },
    });
    const Form = Formous(options)(Component);
    const wrapper = mount(<Form onSubmit={(formStatus, fields) => {
      expect(formStatus.touched).to.be.false;
      expect(fields.name.value).to.equal(name);
      done();
    }} />);
    wrapper.find('button').first().simulate('click');
  });

  it('should not show errors for untouched fields onBlur', () => {
    const options = {
      fields: {
        name: {
          tests: [
            requiredField,
          ],
        },
        email: {
          tests: [
            requiredField,
          ],
        },
      },
    };
    const Component = React.createClass({
      render() {
        return (
          <div>
            <input onBlur={this.props.fields.name.events.onBlur} />
            <p className="name-error">
              {this.props.fields.name.failProps &&
                this.props.fields.name.failProps.error}
            </p>
            <p className="email-error">
              {this.props.fields.email.failProps &&
                this.props.fields.email.failProps.error}
            </p>
            <button
              onClick={this.props.formSubmit(this.props.onSubmit)}>
              submit
            </button>
          </div>
        );
      },
    });
    const Form = Formous(options)(Component);
    const wrapper = mount(<Form />);
    wrapper.find('input').first().props().onBlur({ event: {} });
    expect(wrapper.find('.email-error').first().text()).to.equal('');
  });

  describe('updateFormValues', () => {
    it('can update form values', () => {
      const options = {
        fields: {
          name: {
            tests: [
              {
                critical: false,
                failProps: {},
                test: () => false,
              },
            ],
          },
        },
      };
      const value = 'updated value';
      const Component = React.createClass({
        setValues() {
          this.props.updateFormFields({
            name: value,
          });
        },
        render() {
          return (
            <div>
              <button
                className="setValues"
                onClick={this.setValues} />
              <button
                onClick={this.props.formSubmit(this.props.onSubmit)}>
                submit
              </button>
            </div>
          );
        },
      });
      const Form = Formous(options)(Component);
      const wrapper = mount(<Form onSubmit={() => {}} />);
      wrapper.find('.setValues').first().simulate('click');
      expect(wrapper.find(Component).first()
             .props().fields.name.value).to.equal(value);
    });

    it('runs validations after updating values', (done) => {
      const options = {
        fields: {
          name: {
            tests: [
              {
                critical: true,
                failProps: { error: 'something went wrong' },
                test: () => false,
              },
            ],
          },
        },
      };
      const value = 'updated value';
      const Component = React.createClass({
        setValues() {
          this.props.updateFormFields({
            name: value,
          });
        },
        render() {
          return (
            <div>
              <button
                className="setValues"
                onClick={this.setValues} />
              <button
                className="submit"
                onClick={this.props.formSubmit(this.props.onSubmit)}>
                submit
              </button>
            </div>
          );
        },
      });
      const Form = Formous(options)(Component);
      const wrapper = mount(
        <Form onSubmit={(formStatus) => {
          expect(formStatus.valid).to.be.false;
          done();
        }} />
      );
      wrapper.find('.setValues').simulate('click');
      const formComponent = wrapper.find(Component).first();
      expect(formComponent
             .props().fields.name.failProps)
             .to.deep.equal({ error: 'something went wrong' });
      expect(formComponent
             .props().fields.name.dirty).to.be.true;

      wrapper.find('.submit').first().simulate('click');
    });
  });
});
