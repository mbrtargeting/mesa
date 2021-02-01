#!groovy
// Copyright Ströer SSP GmbH. All Rights Reserved.

pipeline {
    agent {
        dockerfile {
            filename 'Dockerfile.jenkins'
            additionalBuildArgs '''\
                --pull \
            '''
            args '''
                -v /var/run/docker.sock:/var/run/docker.sock
                -v /var/lib/jenkins/.ssh:/var/lib/jenkins/.ssh
                --group-add docker
                -e
        PATH=bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
            '''
        }
    }

    options {
        skipStagesAfterUnstable()
    }

    environment {
        /*
         * Fix for docker "Read timed out"
         * https://github.com/docker/compose/issues/3927
         */
        DOCKER_CLIENT_TIMEOUT=120
        COMPOSE_HTTP_TIMEOUT=120
    }

    stages {
        stage('CI') {
            steps {
                sh '''
                    docker-compose run app
                '''
            }
        }
    }

    post {
        cleanup {
            script {
                if (env.NODE_NAME) {
                    sh 'docker-compose down --volumes'
                }
            }
        }
    }
}
