import Ember from 'ember';
import C from 'ui/utils/constants';

export function normalizeName(str) {
  return str.replace(/\./g, C.SETTING.DOT_CHAR).toLowerCase();
}

export function denormalizeName(str) {
  return str.replace(C.SETTING.DOT_CHAR,'.').toLowerCase();
}

export default Ember.Service.extend(Ember.Evented, {
  access: Ember.inject.service(),
  cookies: Ember.inject.service(),

  all: null,
  promiseCount: 0,

  init() {
    this._super();
    this.set('all', this.get('store').all('activesetting'));
  },

  unknownProperty(key) {
    var obj = this.findByName(key);
    if ( obj )
    {
      var val = obj.get('value');
      if ( val === 'false' )
      {
        return false;
      }
      else if ( val === 'true' )
      {
        return true;
      }
      else
      {
        return val;
      }
    }

    return null;
  },

  setUnknownProperty(key, value) {
    var obj = this.findByName(key);

    if ( value === undefined )
    {
      // Delete by set to undefined is not needed for settings
      throw new Error('Deleting settings is not supported');
    }

    if ( !obj )
    {
      obj = this.get('store').createRecord({
        type: 'setting',
        name: denormalizeName(key),
      });
    }

    this.incrementProperty('promiseCount');

    obj.set('value', value+''); // Values are all strings in settings.
    obj.save().then(() => {
      this.notifyPropertyChange(normalizeName(key));
    }).catch((err) => {
      this.trigger('gotError', err);
    }).finally(() => {
      this.decrementProperty('promiseCount');
    });

    return value;
  },

  promiseCountObserver: function() {

    if (this.get('promiseCount') <= 0) {
      this.trigger('settingsPromisesResolved');
    }
  }.observes('promiseCount'),

  findByName(name) {
    return this.get('asMap')[normalizeName(name)];
  },

  asMap: function() {
    var out = {};
    (this.get('all')||[]).forEach((setting) => {
      var name = normalizeName(setting.get('name'));
      out[name] = setting;
    });

    return out;
  }.property('all.@each.{name,value}'),

  uiVersion: function() {
    return 'v' + this.get('app.version');
  }.property('app.version'),

  issueBody: function() {
    var str = '*Describe your issue here*\n\n\n---\n| Useful | Info |\n| :-- | :-- |\n' +
      `|Versions|Rancher \`${this.get('rancherVersion')||'-'}\` ` +
        `Cattle: \`${this.get('cattleVersion')||'-'}\` ` +
        `UI: \`${this.get('uiVersion')||'--'}\` |\n`;

      if ( this.get('access.enabled') )
      {
        str += `|Access|\`${this.get('access.provider').replace(/config/,'')}\` ${this.get('access.admin') ? '\`admin\`' : ''}|\n`;
      }
      else
      {
        str += '|Access|`Disabled`}|\n';
      }

      str += `|Route|\`${this.get('application.currentRouteName')}\`|\n`;

    return encodeURIComponent(str);
  }.property(),

  rancherVersion: Ember.computed.alias(`asMap.${C.SETTING.VERSION_RANCHER}.value`),
  composeVersion: Ember.computed.alias(`asMap.${C.SETTING.VERSION_COMPOSE}.value`),
  cattleVersion: Ember.computed.alias(`asMap.${C.SETTING.VERSION_CATTLE}.value`),
  dockerMachineVersion: Ember.computed.alias(`asMap.${C.SETTING.VERSION_MACHINE}.value`),
  goMachineVersion: Ember.computed.alias(`asMap.${C.SETTING.VERSION_GMS}.value`),

  hasVm: Ember.computed.equal(`asMap.${C.SETTING.VM_ENABLED}.value`, 'true'),

  _plValue: function() {
    return this.get(`cookies.${C.COOKIE.PL}`) || '';
  }.property(`cookies.${C.COOKIE.PL}`),

  isPrivateLabel: function() {
    return this.get('_plValue').toUpperCase() !== C.COOKIE.PL_RANCHER_VALUE.toUpperCase();
  }.property('_plValue'),

  appName: function() {
    if ( this.get('isPrivateLabel') )
    {
      return this.get('_plValue');
    }
    else
    {
      return this.get('app.appName'); // Rancher
    }
  }.property('isPrivateLabel','_plValue'),
});
