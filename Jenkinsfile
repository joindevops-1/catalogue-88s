pipeline {
    agent { node { label 'roboshop' } }

    stages {
        stage('Feature Branch Pipeline') {
            // Skip everything on main branch
            when {
                not { branch 'main' }
            }
            stages {
                stage('Install Dependencies') {
                    steps {
                        sh 'npm install'
                    }
                }

                stage('Unit Tests') {
                    steps {
                        sh 'npm test'
                    }
                }

                stage('SonarQube Analysis') {
                    environment {
                        def scannerHome = tool 'sonarqube'
                    }
                    steps {
                        script{
                            withSonarQubeEnv('sonarqube') {
                                sh  "${scannerHome}/bin/sonar-scanner"
                            }
                        }
                    }
                }

                stage('Quality Gate') {
                    steps {
                        timeout(time: 5, unit: 'MINUTES') {
                            waitForQualityGate abortPipeline: true
                        }
                    }
                }

                stage('Docker Build') {
                    steps {
                        sh """
                            docker build \
                                -t catalogue:${env.BRANCH_NAME}-${env.BUILD_NUMBER} \
                                .
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded on branch: ${env.BRANCH_NAME}"
        }
        failure {
            echo "Pipeline failed on branch: ${env.BRANCH_NAME}"
        }
    }
}
