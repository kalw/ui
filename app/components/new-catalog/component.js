import Ember from 'ember';
import NewOrEdit from 'ui/mixins/new-or-edit';
import ShellQuote from 'npm:shell-quote';
import C from 'ui/utils/constants';

export default Ember.Component.extend(NewOrEdit, {
  allTemplates: null,
  templateResource: null,
  environmentResource: null,
  versionsArray: null,
  versionsLinks: null,
  serviceChoices: null,

  classNames: ['launch-catalog'],

  primaryResource: Ember.computed.alias('environmentResource'),
  editing: false,

  previewOpen: false,
  previewTab: 'docker-compose',
  questionsArray: null,
  selectedTemplateUrl: null,
  selectedTemplateModel: null,
  readmeContent: null,

  actions: {
    cancel: function() {
      this.sendAction('cancel');
    },

    togglePreview: function() {
      this.toggleProperty('previewOpen');
    },

    selectPreviewTab: function(tab) {
      this.set('previewTab', tab);
    },

    changeTemplate: function(tpl) {
      this.get('application').transitionToRoute('applications-tab.catalog.launch', tpl.id);
    },
  },

  didReceiveAttrs() {
    this._super();

    this.set('editing', !!this.get('primaryResource.id'));

    // Select the default version
    var def = this.get('templateResource.defaultVersion');
    var links = this.get('versionLinks');
    if (links[def]) {
      this.set('selectedTemplateUrl', links[def]);
    } else {
      this.set('selectedTemplateUrl', null);
    }
  },

  getReadme: function() {
    this.get('selectedTemplateModel').followLink('readme').then((response) => {
      this.set('readmeContent', response);
    });
  },

  templateChanged: function() {
    var link = this.get('selectedTemplateUrl');
    if (link) {
      this.set('loading', true);

      var current = this.get('environmentResource.environment');
      this.get('store').request({
        url: link
      }).then((response) => {
        if (response.questions) {
          response.questions.forEach((item) => {
            // This will be the component that is rendered to edit this answer
            item.inputComponent = 'schema/input-'+item.type;

            // Only types marked supported will show the component, Ember will explode if the component doesn't exist
            item.supported = C.SUPPORTED_SCHEMA_INPUTS.indexOf(item.type) >= 0;

            if (typeof current[item.variable] !== 'undefined') {
              // If there's an existing value, use it (for upgrade)
              item.answer = current[item.variable];
            } else if (item.type === 'service' || item.type === 'certificate') {
                // Loaded async and then the component picks the default
            } else if ( item.type === 'boolean' ) {
              // Coerce booleans
              item.answer = (item.default === 'true' || item.default === true);
            } else {
              // Everythign else
              item.answer = item.default;
            }
          });
        }

        this.set('selectedTemplateModel', response);
        if (response.links.readme) {
          this.getReadme();
        } else {
          this.set('readmeContent', null);
        }
        this.set('loading', false);
      }, ( /*error*/ ) => {});
    } else {
      this.set('selectedTemplateModel', null);
    }
  }.observes('selectedTemplateUrl').on('init'),

  answers: function() {
    var out = {};
    (this.get('selectedTemplateModel.questions') || []).forEach((item) => {
      out[item.variable] = item.answer;
    });

    return out;
  }.property('selectedTemplateModel.questions.@each.{variable,answer}'),

  answersArray: Ember.computed.alias('selectedTemplateModel.questions'),

  answersString: function() {
    return (this.get('answersArray')||[]).map((obj) => {
      if (obj.answer === null || obj.answer === undefined) {
        return obj.variable + '=';
      } else {
        return obj.variable + '=' + ShellQuote.quote([obj.answer]);
      }
    }).join("\n");
  }.property('answersArray.@each.{variable,answer}'),

  validate() {
    var errors = [];

    if (!this.get('editing') && !this.get('environmentResource.name')) {
      errors.push('Name is required');
    }

    if (this.get('selectedTemplateModel.questions')) {
      this.get('selectedTemplateModel.questions').forEach((item) => {
        if (item.required && item.type !== 'boolean' && !item.answer) {
          errors.push(`${item.label} is required`);
        }
      });
    }

    if (errors.length) {
      this.set('errors', errors.uniq());
      this.$().parent().scrollTop(0);
      return false;
    }

    return true;
  },

  newExternalId: function() {
    var systemCategories = C.EXTERNALID.SYSTEM_CATEGORIES.map((str) => { return str.trim().toLowerCase(); });
    var category = (this.get('templateResource.category')||'').trim().toLowerCase();
    var externalId = ( systemCategories.indexOf(category) >= 0 ? C.EXTERNALID.KIND_SYSTEM_CATALOG : C.EXTERNALID.KIND_CATALOG );
    externalId += C.EXTERNALID.KIND_SEPARATOR + this.get('selectedTemplateModel.uuid');
    return externalId;
  }.property('templateResource.category','selectedTemplateModel.uuid'),

  willSave() {
    this.set('errors', null);
    var ok = this.validate();
    if (!ok) {
      // Validation failed
      return false;
    }

    this.get('environmentResource').setProperties({
      dockerCompose: this.get('selectedTemplateModel.dockerCompose'),
      rancherCompose: this.get('selectedTemplateModel.rancherCompose'),
      environment: this.get('answers'),
      externalId: this.get('newExternalId'),
    });

    return true;
  },

  doSave() {
    if (this.get('editing')) {
      return this.get('environmentResource').doAction('upgrade', {
        dockerCompose: this.get('environmentResource.dockerCompose'),
        rancherCompose: this.get('environmentResource.rancherCompose'),
        environment: this.get('environmentResource.environment'),
        externalId: this.get('newExternalId'),
      });
    } else {
      return this._super.apply(this, arguments);
    }
  },

  doneSaving() {
    return this.get('router').transitionTo('environment', this.get('primaryResource.id'));
  }

});
