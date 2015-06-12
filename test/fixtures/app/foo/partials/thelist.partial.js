module.exports = {
    scope:      { question: '=' },
    defaults:   { myman: 'yes' },

    attachToScope: ['answerState'],
    remodelOnScopeChange: ['question.answers', 'question.stats.count.answers'],

    model: function (safe, activeUser) {
        return function (model) {
            model.isRelevanceSort = model.isRelevanceSort === undefined ?  true : model.isRelevanceSort;
            model.userAlreadyAnswered = !!model.userAlreadyAnswered;
            model.canEditQuestion = safe.canEdit(model.question, activeUser, false);
        };
    },
    serverPreprocessing: function (reply) {
        if ((new Date()).getTime() < 234) {
            reply().redirect('/again');
        }
    },

    /* jshint quotmark:false */
    view: function (div, span, a, h3) {
        return div({ 'class': 'answrs' },
            div(
                {
                    'class': 'answers-hdr clearfix',
                    'ng-if': 'answersInArray'
                },
                div({ 'class': 'answers-count' },
                    h3({
                        'ng-pluralize': null,
                        'count':    'answerCount',
                        'when':     "{'one':'{} Answer', 'other': '{} Answers'}"
                    })
                ),
                div({
                    'ng-if':        'answersInArray > 1',
                    'class':        'answers-sort'
                }, [
                    a({
                        'href':     '#',
                        'ng-class': '{ active: !isRelevanceSort }',
                        'gh-tap':   'toggleSort()',
                        'f-text':   'Date'
                    }),
                    span({ 'class': 'bar' }, ' | '),
                    a({
                        'href':     '#',
                        'ng-class': '{ active: isRelevanceSort }',
                        'gh-tap':   'toggleSort()',
                        'f-text':   'Relevance'
                    }),
                    span({ 'class': 'sorted', 'f-text': 'By' })
                ])
            )
        );
    },
    controller: function ($timeout, $scope) {
        $timeout(function () {
            $scope.val = true;
        }, 100);
    },
    eventBusListeners: {
        'start.up': function (modals) {
            modals.show('yes');
        },
        'end.now': function (show) {
            show.now();
        }
    },
    uiEventHandlers: {
        userClick: function ($scope) {
            $scope.click = true;
        },
        meDoubleClick: function ($scope, $timeout) {
            $timeout(function () {
                $scope.hat = 2;
            }, 500);
        }
    }
};