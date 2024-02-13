#!/usr/bin/env groovy
@Library('adscale')

import org.adscale.Utils

def utils = new Utils(this)

ansiColor('xterm') {
    timestamps {
        node('default') {
            def branch = "${env.BRANCH_NAME}"
            def buildUrl = "${env.BUILD_URL}"

            stage('Checkout') {
                deleteDir()
                // Setup symlink ~/development/adscale -> WORKSPACE
                // and set env var ADSCALE_DEV_ROOT=WORKSPACE
                utils.resetDevelopmentAdscaleSymlink()
                utils.gitClone(branch, 'mesa')
                utils.dockerLoginToECR()
            }

            utils.stageIfNotFailing('Run CI') {
                withEnv(['PATH+EXTRA=/home/jenkins/development/toolbox/bin', 'COMPOSE_FILE=docker-compose.yml']) {
                    timeout(15) {
                        catchError(buildResult: 'FAILURE', stageResult: 'UNSTABLE') {
                            sh 'docker-compose run app'
                        }
                    }
                }
                if (utils.jobIsFailing()) {
                    utils.slackSendMsg "`mesa` CI failed for branch `${branch}`. <${buildUrl}|See here for details>.", DANGER, "#labs-berlin-ops"
                }
            }

            stage('Cleanup') {
                withEnv(['PATH+EXTRA=/home/jenkins/development/toolbox/bin', 'COMPOSE_FILE=docker-compose.yml']) {
                    sh 'docker-compose down --volumes'
                }
                utils.flushDocker()
                deleteDir()
            }

        }
    }
}
