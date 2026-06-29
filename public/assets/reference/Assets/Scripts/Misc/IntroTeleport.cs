using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class IntroTeleport : MonoBehaviour {

	// Use this for initialization
	void Start () {

	}

	// Update is called once per frame
	void Update () {

	}

	void OnEnable(){
		gameObject.GetComponent<changeScene>().changeOriginName("Intro");
		Application.LoadLevel("VillagerHouse");
		gameObject.SetActive (false);
	}
}
