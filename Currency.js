/* * GNU General Public License Usage
 * This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.
 *
 * http://www.gnu.org/licenses/lgpl.html
 *
 * @description: This class provide additional format to numbers by extending Ext.form.field.Number
 *
 * @author: Greivin Britton
 * @contributor: Wemerson Januario (wemerson.januario@gmail.com)
 * @email: brittongr@gmail.com
 * @version: 2 compatible with ExtJS 4 (And ExtJS 5 - chamacs)
 *
 */
Ext.define('Ext.ux.form.field.Currency', {
    extend: 'Ext.form.field.Number',//Extending the NumberField
    xtype: [
        'currencyfield',
        'numericfield'
    ],
    alternateClassName: ['Ext.ux.form.field.Numeric', 'Ext.ux.form.NumericField'],
    currencySymbol: '$ ',
    useThousandSeparator: true,
    thousandSeparator: '.',
    alwaysDisplayDecimals: true,
    // MOD - chamacs
    // @private
    isCurrency: false,

    // MOD - pmiguelmartins
    currencySymbolPos: 'left', // left , right

    // MOD - chamacs
    //fieldStyle: 'text-align: right;',

    // MOD - chamacs
    allowExponential: false,

    /**
     * initComponent
     */
    initComponent: function () {
        if (this.useThousandSeparator && this.decimalSeparator == ',' && this.thousandSeparator == ',') {
            this.thousandSeparator = '.';
        }
        else if (this.allowDecimals && this.thousandSeparator == '.' && this.decimalSeparator == '.') {
            this.decimalSeparator = ',';
        }

        // MOD - chamacs
        this.isCurrency = !Ext.isEmpty(this.currencySymbol);

        this.callParent(arguments);
    },

    /**
     * setValue
     */
    setValue: function (value) {
        var me = this,
            bind, valueBind;

        // This portion of the code is to prevent a binding from stomping over
        // the typed value. Say we have decimalPrecision 4 and the user types
        // 1.23456. The value of the field will be set as 1.2346 and published to
        // the viewmodel, which will trigger the binding to fire and setValue to
        // be called on the field, which would then set the value (and rawValue) to
        // 1.2346. Instead, if we have focus and the value is the same, just leave
        // the rawValue alone
        if (me.hasFocus) {
            bind = me.getBind();
            valueBind = bind && bind.value;
            if (valueBind && valueBind.syncing && value === me.value) {
                return me;
            }
        }
        
        // MOD - chamacs
        Ext.ux.form.field.Currency.superclass.setValue.apply(this, [value != null ? value.toString().replace('.', this.decimalSeparator) : value]);

        this.setRawValue(this.getFormattedValue(this.getValue()));
    },

    /**
     * getFormattedValue
     */
    getFormattedValue: function (value) {
        if (Ext.isEmpty(value) || !this.hasFormat()) {
            return value;
        }
        else {
            var neg = null;

            value = (neg = value < 0) ? value * -1 : value;
            value = this.allowDecimals && this.alwaysDisplayDecimals ? value.toFixed(this.decimalPrecision) : value;

            if (this.useThousandSeparator) {
                if (this.useThousandSeparator && Ext.isEmpty(this.thousandSeparator)) {
                    throw ('NumberFormatException: invalid thousandSeparator, property must has a valid character.');
                }
                if (this.thousandSeparator == this.decimalSeparator) {
                    throw ('NumberFormatException: invalid thousandSeparator, thousand separator must be different from decimalSeparator.');
                }

                value = value.toString();

                var ps = value.split('.');
                ps[1] = ps[1] ? ps[1] : null;

                var whole = ps[0];

                var r = /(\d+)(\d{3})/;

                var ts = this.thousandSeparator;

                while (r.test(whole)) {
                    whole = whole.replace(r, '$1' + ts + '$2');
                }

                value = whole + (ps[1] ? this.decimalSeparator + ps[1] : '');
            }

            // MOD - pmiguelmartins - updated by chamacs
            var position1 = this.isCurrency ? this.currencySymbol + ' ' : '';
            var position2 = value;
            if (this.currencySymbolPos === 'right') {
                position1 = value;
                position2 = this.isCurrency ? ' ' + this.currencySymbol : '';
            }
            return Ext.String.format('{0}{1}{2}', position1, (neg ? '-' : ''), position2);
        }
    },

    /**
     * overrides parseValue to remove the format applied by this class
     */
    parseValue: function (value) {
        // MOD - chamacs
        //Replace the currency symbol and thousand separator
        return Ext.ux.form.field.Currency.superclass.parseValue.apply(this, [this.removeFormat(value)]);
    },

    /**
     * Remove only the format added by this class to let the superclass validate with it's rules.
     * @param {Object} value
     */
    removeFormat: function (value) {
        // MOD - chamacs
        if (Ext.isEmpty(value)) {
            return '';
        }
        else if (!this.hasFormat()) {
            return value;
        }
        else {
            // MOD - bhaidaya
            value = Ext.String.trim(value.toString().replace(this.currencySymbol, ''));

            value = this.useThousandSeparator ? value.replace(new RegExp('[' + this.thousandSeparator + ']', 'g'), '') : value;
            return value;
        }
    },

    /** * Remove the format before validating the the value.
     * @param {Number} value
     */
    getErrors: function (value) {
        //FIX data binding by antiplaka
        value = arguments.length > 0 ? value : this.processRawValue(this.getRawValue());
        return this.callParent([this.removeFormat(value)]);
    },

    /**
     * hasFormat
     */
    hasFormat: function () {
        return this.decimalSeparator != '.' || (this.useThousandSeparator == true && this.getRawValue() != null) || !Ext.isEmpty(this.currencySymbol) || this.alwaysDisplayDecimals;
    },

    /**
     * Display the numeric value with the fixed decimal precision and without the format using the setRawValue, don't need to do a setValue because we don't want a double
     * formatting and process of the value because beforeBlur perform a getRawValue and then a setValue.
     */
    onFocus: function () {
        this.setRawValue(this.removeFormat(this.getRawValue()));

        this.callParent(arguments);
    },

    /**
     * MOD - Jeff.Evans
     */
    processRawValue: function (value) {
        return this.removeFormat(value);
    }
});
