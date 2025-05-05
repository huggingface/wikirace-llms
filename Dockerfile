FROM python:3.9

# install nodejs and npm
ENV PYTHONUNBUFFERED 1
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g yarn

#Set up a new user named "user" with user ID 1000
RUN useradd -m -u 1000 user

# Switch to the "user" user
USER user

# Set home to the user's home directory
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

# Set the working directory to the user's home directory
WORKDIR $HOME/app

COPY requirements.txt .

# Try and run pip command after setting the user with `USER user` to avoid permission issues with Python
RUN pip install --no-cache-dir --upgrade pip

RUN pip install -r requirements.txt

# Copy the current directory contents into the container at $HOME/app setting the owner to the user
COPY --chown=user . $HOME/app

ENV VITE_ENV=production

RUN --mount=type=secret,id=HUGGINGFACE_CLIENT_SECRET,mode=0444,required=true \
   echo "HUGGINGFACE_CLIENT_SECRET=$(cat /run/secrets/HUGGINGFACE_CLIENT_SECRET)" >> .env
   
RUN echo "VITE_ENV=production" >> .env

RUN yarn install
RUN yarn build

RUN --mount=type=secret,id=HF_TOKEN,mode=0444,required=true \
    echo "HF_TOKEN=$(cat /run/secrets/HF_TOKEN)" >> .env

RUN echo $HF_TOKEN

RUN --mount=type=secret,id=HF_TOKEN,mode=0444,required=true \
    curl https://huggingface.co/api/whoami-v2 -H "Authorization: Bearer $(cat /run/secrets/HF_TOKEN)"

RUN --mount=type=secret,id=HF_TOKEN,mode=0444,required=true \
    curl -L https://huggingface.co/HuggingFaceTB/simplewiki-pruned-text-350k/resolve/main/wikihop.db -H "Authorization: Bearer $(cat /run/secrets/HF_TOKEN)" -o wikihop.db

ENV WIKISPEEDIA_DB_PATH=/home/user/app/wikihop.db


CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860", "--env-file", ".env"]


# # Download a checkpoint
# RUN mkdir content
# ADD --chown=user https://<SOME_ASSET_URL> content/<SOME_ASSET_NAME>
