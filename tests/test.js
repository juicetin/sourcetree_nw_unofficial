function fix_str (str) {
	return str.replace(/\//g, "\\/");
}

this.testBasicButtons = function(browser) {
	browser.expect.element('body').to.be.visible;
	browser.expect.element('#commit').be.visible;
	browser.expect.element('#checkout').be.visible;
	browser.expect.element('#reset').be.visible;
	browser.expect.element('#stash').be.visible;
	browser.expect.element('#add').be.visible;
	browser.expect.element('#remove').be.visible;
	browser.expect.element('#addRemove').be.visible;
	browser.expect.element('#fetch').be.visible;
	browser.expect.element('#pull').be.visible;
	browser.expect.element('#push').be.visible;
	browser.expect.element('#branch').be.visible;
	browser.expect.element('#merge').be.visible;
	browser.expect.element('#tag').be.visible;
};

this.testRepoExistence = function(browser) {
	browser.expect.element('#' + fix_str('/home/justinting/programming/sourcetree_nw_unofficial')).to.be.visible;
	browser.click('#\\/home\\/justinting\\/programming\\/sourcetree_nw_unofficial');
	browser.expect.element('#e023edd').to.be.visible;
	browser.click('#load-repo');
};

// module.exports = {
// 	'Basic button clicks': function (browser) {
// 		browser	
// 			.url('file:///home/justinting/programming/sourcetree_nw_unofficial/index.html')
// 			.waitForElementVisible('body', 100)
// 			.waitForElementVisible('#commit', 100)
// 			.waitForElementVisible('#checkout', 100)
// 			.waitForElementVisible('#reset', 100)
// 			.waitForElementVisible('#stash', 100)
// 			.waitForElementVisible('#add', 100)
// 			.waitForElementVisible('#remove', 100)
// 			.waitForElementVisible('#addRemove', 100)
// 			.waitForElementVisible('#fetch', 100)
// 			.waitForElementVisible('#pull', 100)
// 			.waitForElementVisible('#push', 100)
// 			.waitForElementVisible('#branch', 100)
// 			.waitForElementVisible('#merge', 100)
// 			.waitForElementVisible('#tag', 100)
// 			.waitForElementVisible('#\\/home\\/justinting\\/programming\\/sourcetree_nw_unofficial', 100)
// 
// 			.end();
// 	},
// };
